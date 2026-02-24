const EmergencyRequest = require('../models/EmergencyRequest');
const Hospital = require('../models/Hospital');

// Create new emergency request
const createEmergency = async (data) => {
    const { userId, userLocation, severity, selectedHospitalId, ETA } = data;

    // Populate defaults based on severity if missing
    let { requiresICU, requiresBed, requiresAmbulance, requiresOxygen } = data;

    // Fallback logic
    if (requiresICU === undefined) requiresICU = severity >= 4;
    if (requiresBed === undefined) requiresBed = severity < 4;
    if (requiresAmbulance === undefined) requiresAmbulance = true;
    if (requiresOxygen === undefined) requiresOxygen = false;

    const emergency = await EmergencyRequest.create({
        userId,
        userLocation,
        severity,
        hospitalId: selectedHospitalId,
        requiresICU,
        requiresBed,
        requiresAmbulance,
        requiresOxygen,
        status: 'pending'
    });

    return emergency;
};

// Accept emergency request
const acceptEmergency = async (hospitalId, emergencyId, io) => {
    const hospital = await Hospital.findById(hospitalId);
    const emergency = await EmergencyRequest.findById(emergencyId);

    if (!hospital || !emergency) {
        throw new Error('Hospital or Emergency not found');
    }

    const { requiresICU, requiresBed, requiresAmbulance, requiresOxygen } = emergency;

    // Check Resources
    if (requiresAmbulance && hospital.ambulancesAvailable <= 0) throw new Error('No ambulances available');
    if (requiresICU && hospital.availableICU <= 0) throw new Error('No ICU beds available');
    if (requiresBed && hospital.availableBeds <= 0) throw new Error('No beds available');
    if (requiresOxygen && hospital.availableOxygen <= 0) throw new Error('No oxygen available');

    // Decrement
    if (requiresAmbulance) hospital.ambulancesAvailable -= 1;
    if (requiresICU) hospital.availableICU -= 1;
    if (requiresBed) hospital.availableBeds -= 1;
    if (requiresOxygen && hospital.availableOxygen > 0) hospital.availableOxygen -= 1;

    // Dispatch
    const minutes = Math.floor(Math.random() * (20 - 10 + 1) + 10);
    const returnTime = new Date(Date.now() + minutes * 60000).toISOString();

    // Severity string for display
    const severityMap = ['Low', 'Low', 'Medium', 'High', 'Critical']; // 0 index unused, 1-5
    // Safety check just in case severity is out of bounds or string
    let severityStr = 'Medium';
    if (typeof emergency.severity === 'number') {
        const idx = Math.min(Math.max(emergency.severity, 1), 5); // Clamp 1-5 (assuming severity 5 exists? Schema says max 5)
        // Wait, schema says max 5, but my map logic earlier was >=4 is Critical.
        // Let's align with enum: Low, Medium, High, Critical.
        // 1=Low, 2=Low/Medium? 
        // Let's use: 1-2: Low, 3: Medium, 4: High, 5: Critical? 
        // Or 1: Low, 2: Medium, 3: High, 4-5: Critical.
        if (emergency.severity <= 2) severityStr = 'Low';
        else if (emergency.severity === 3) severityStr = 'Medium';
        else if (emergency.severity === 4) severityStr = 'High';
        else severityStr = 'Critical';
    }

    hospital.dispatches.push({
        emergencyId: emergency._id,
        severity: severityStr,
        dispatchedAt: new Date(),
        estimatedReturnTime: returnTime,
        status: 'dispatched'
    });

    await hospital.save();

    emergency.status = 'accepted';
    await emergency.save();

    return { emergency, hospital, queued: false };
};

// Process Queue
const processQueue = async (hospitalId, io) => {
    // Re-fetch hospital to avoid race conditions
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital || hospital.waitingQueue.length === 0) return;

    // Sort Queue logic
    const severityMap = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };

    hospital.waitingQueue.sort((a, b) => {
        const scoreA = severityMap[a.severity] || 0;
        const scoreB = severityMap[b.severity] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return new Date(a.joinedAt) - new Date(b.joinedAt);
    });

    let queueUpdated = false;
    let hospitalUpdated = false;

    // Iterate carefully
    let i = 0;
    while (i < hospital.waitingQueue.length) {
        const item = hospital.waitingQueue[i];

        // Explicit requirements
        // Ensure requirements object exists (it might be missing in old data)
        const reqs = item.requirements || { icu: false, bed: true, ambulance: true, oxygen: false };
        // Note: Defaulting old data to Bed+Ambulance is a safe bet for generic emergency

        const canAssign =
            (!reqs.ambulance || hospital.ambulancesAvailable > 0) &&
            (!reqs.icu || hospital.availableICU > 0) &&
            (!reqs.bed || hospital.availableBeds > 0) &&
            (!reqs.oxygen || hospital.availableOxygen > 0);

        if (canAssign) {
            // Assign
            if (reqs.ambulance) hospital.ambulancesAvailable--;
            if (reqs.icu) hospital.availableICU--;
            if (reqs.bed) hospital.availableBeds--;
            if (reqs.oxygen) hospital.availableOxygen--;

            const minutes = Math.floor(Math.random() * (20 - 10 + 1) + 10);
            const returnTime = new Date(Date.now() + minutes * 60000).toISOString();

            hospital.dispatches.push({
                emergencyId: item.emergencyId,
                severity: item.severity,
                dispatchedAt: new Date(),
                estimatedReturnTime: returnTime,
                status: 'dispatched'
            });

            // Remove from queue
            hospital.waitingQueue.splice(i, 1); // remove at index
            // Don't increment i, because next item shifts to i

            queueUpdated = true;
            hospitalUpdated = true;

            await EmergencyRequest.findByIdAndUpdate(item.emergencyId, { status: 'accepted' });
            console.log(`Queue processed: Assigned to ${item.emergencyId}`);

            // STRICT PRIORITY: Check if we should stop? 
            // If we assigned, we can continue to try next? 
            // Yes, if we have more resources, why not serve next?
            // "Strict priority" usually means "Don't serve B if A is waiting AND A needs the resource B is taking".
            // Here, A *took* the resources. So we can check B.
            // If A *could not* take resources, we stopped (in the else block - wait, I need to implement that).
        } else {
            // Top priority item CANNOT be served.
            // Strict Priority Rule: Block lower priority items from "stealing" resources?
            // If we skip, a Low priority item might take the last Bed that the Critical item didn't need (because Critical needed ICU).
            // Is that stealing? No.
            // But if Critical needed Ambulance OR ICU, and we have Ambulance but no ICU.
            // And Low needs Ambulance + Bed.
            // If we give Ambulance to Low, then when ICU frees up, Critical has no Ambulance!
            // So: If High priority is blocked on ANY resource, we should NOT give shared resources to Low priority.
            // Safe bet: Break loop if head of queue cannot be served.
            break;
        }
    }

    if (hospitalUpdated) {
        await hospital.save();
        if (io) {
            io.emit('hospitalUpdate', {
                hospitalId: hospital._id,
                availableBeds: hospital.availableBeds,
                availableICU: hospital.availableICU,
                availableOxygen: hospital.availableOxygen,
                ambulancesAvailable: hospital.ambulancesAvailable,
                dispatches: hospital.dispatches
            });
            io.emit('queueUpdated', { hospitalId: hospital._id, queue: hospital.waitingQueue });
        }
    }
};

// Force Assign from Queue
const assignQueue = async (hospitalId, emergencyId, io) => {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) throw new Error('Hospital not found');

    const index = hospital.waitingQueue.findIndex(item => item.emergencyId.toString() === emergencyId);
    if (index === -1) throw new Error('Emergency not found in queue');

    const item = hospital.waitingQueue[index];

    // Force assign implies we might bypass checks? 
    // Or just assign what we have.
    // Let's assume force assign decrements even if < 0? No, that breaks invariants.
    // Let's do best effort or strict check?
    // "Force" usually means "Do it now".
    // I'll check resources but maybe allow override? 
    // The user requirement didn't specify force behavior details. 
    // I'll enforce 0 limit to keep DB sane.

    if (hospital.ambulancesAvailable <= 0 || (hospital.availableBeds <= 0 && hospital.availableICU <= 0)) {
        throw new Error('Not enough resources to force assign');
    }

    // Deduct (User logic: Manual assignment usually implies user knows best)
    // We assume Bed assignment for now
    if (item.severity === 'Critical' || item.severity === 'High') {
        if (hospital.availableICU > 0) hospital.availableICU--;
        else if (hospital.availableBeds > 0) hospital.availableBeds--;
    } else {
        if (hospital.availableBeds > 0) hospital.availableBeds--;
        else if (hospital.availableICU > 0) hospital.availableICU--; // Upgrade?
    }
    if (hospital.ambulancesAvailable > 0) hospital.ambulancesAvailable--;

    // Move to dispatch
    const minutes = Math.floor(Math.random() * (20 - 10 + 1) + 10);
    const returnTime = new Date(Date.now() + minutes * 60000).toISOString();

    hospital.dispatches.push({
        emergencyId: item.emergencyId,
        severity: item.severity,
        dispatchedAt: new Date(),
        estimatedReturnTime: returnTime,
        status: 'dispatched'
    });

    hospital.waitingQueue.splice(index, 1);
    await hospital.save();

    await EmergencyRequest.findByIdAndUpdate(emergencyId, { status: 'accepted' });

    if (io) {
        io.emit('hospitalUpdate', {
            hospitalId: hospital._id,
            availableBeds: hospital.availableBeds,
            availableICU: hospital.availableICU,
            availableOxygen: hospital.availableOxygen,
            ambulancesAvailable: hospital.ambulancesAvailable,
            dispatches: hospital.dispatches
        });
        io.emit('queueUpdated', { hospitalId: hospital._id, queue: hospital.waitingQueue });
    }

    return hospital;
};

// Mark dispatch as completed
const markDispatchCompleted = async (hospitalId, dispatchId, io) => {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) throw new Error('Hospital not found');

    const dispatch = hospital.dispatches.id(dispatchId);

    if (!dispatch || dispatch.status === 'completed') {
        return hospital;
    }

    dispatch.status = 'completed';

    if (hospital.ambulancesAvailable < hospital.ambulancesTotal) {
        hospital.ambulancesAvailable += 1;
    }

    await hospital.save();

    console.log(`Dispatch ${dispatchId} completed for hospital ${hospitalId}`);

    // Check Queue Logic triggering
    // processQueue call is handled by caller or we call it here?
    // In authController, updateHospitalResources calling processQueue.
    // But here? The user said "Trigger processQueue when ambulances return".
    // I should call processQueue here!

    await processQueue(hospital._id, io);

    return hospital;
};

// Reject emergency request
const rejectEmergency = async (emergencyId) => {
    const emergency = await EmergencyRequest.findById(emergencyId);
    if (!emergency) {
        throw new Error('Emergency not found');
    }

    emergency.status = 'rejected';
    await emergency.save();

    return emergency;
};

// Background job helper
const autoCompleteDispatches = async (io) => {
    const hospitals = await Hospital.find({
        'dispatches.status': 'dispatched',
        'dispatches.estimatedReturnTime': { $lte: new Date() }
    });

    for (const hospital of hospitals) {
        let updated = false;
        for (const dispatch of hospital.dispatches) {
            if (dispatch.status === 'dispatched' && new Date(dispatch.estimatedReturnTime) <= new Date()) {
                dispatch.status = 'completed';
                if (hospital.ambulancesAvailable < hospital.ambulancesTotal) {
                    hospital.ambulancesAvailable += 1;
                }
                updated = true;
                console.log(`Auto-completing dispatch ${dispatch._id} for hospital ${hospital._id}`);
            }
        }

        if (updated) {
            await hospital.save();
            await processQueue(hospital._id, io); // Trigger queue!
        }
    }
};

module.exports = {
    createEmergency,
    acceptEmergency,
    rejectEmergency,
    markDispatchCompleted,
    autoCompleteDispatches,
    processQueue,
    assignQueue
};
