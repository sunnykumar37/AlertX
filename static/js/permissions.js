const CAMERA_KEY = "camera_granted";
const LOCATION_KEY = "location_granted";

function parseStoredFlag(key) {
    return localStorage.getItem(key) === "true";
}

function saveFlags(cameraGranted, locationGranted) {
    localStorage.setItem(CAMERA_KEY, String(cameraGranted));
    localStorage.setItem(LOCATION_KEY, String(locationGranted));
}

function isSecureOrLocalhost() {
    return window.isSecureContext || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

async function getPermissionState(name) {
    if (!navigator.permissions || !navigator.permissions.query) {
        return null;
    }

    try {
        const status = await navigator.permissions.query({ name });
        return status.state;
    } catch (error) {
        return null;
    }
}

async function checkPermissions() {
    let cameraGranted = parseStoredFlag(CAMERA_KEY);
    let locationGranted = parseStoredFlag(LOCATION_KEY);

    const [cameraState, locationState] = await Promise.all([
        getPermissionState("camera"),
        getPermissionState("geolocation"),
    ]);

    if (cameraState === "granted") {
        cameraGranted = true;
    }
    if (cameraState === "denied") {
        cameraGranted = false;
    }

    if (locationState === "granted") {
        locationGranted = true;
    }
    if (locationState === "denied") {
        locationGranted = false;
    }

    saveFlags(cameraGranted, locationGranted);

    return {
        cameraGranted,
        locationGranted,
        allGranted: cameraGranted && locationGranted,
        secureContext: isSecureOrLocalhost(),
    };
}

async function requestPermissions() {
    if (!isSecureOrLocalhost()) {
        return {
            cameraGranted: false,
            locationGranted: false,
            allGranted: false,
            status: "error",
            message: "Permissions require HTTPS in production. Please use a secure connection.",
        };
    }

    let cameraGranted = false;
    let locationGranted = false;

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        cameraGranted = true;
        stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
        cameraGranted = false;
    }

    try {
        await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            });
        });
        locationGranted = true;
    } catch (error) {
        locationGranted = false;
    }

    saveFlags(cameraGranted, locationGranted);

    let status = "warning";
    let message = "Some permissions are still missing. Please retry and allow access in browser prompts.";

    if (cameraGranted && locationGranted) {
        status = "success";
        message = "Emergency permissions enabled. SOS will work instantly.";
    } else if (!cameraGranted && !locationGranted) {
        status = "error";
        message = "Camera and location permissions were denied.";
    } else if (!cameraGranted) {
        status = "warning";
        message = "Location permission granted. Camera permission is still missing.";
    } else if (!locationGranted) {
        status = "warning";
        message = "Camera permission granted. Location permission is still missing.";
    }

    return {
        cameraGranted,
        locationGranted,
        allGranted: cameraGranted && locationGranted,
        status,
        message,
    };
}

function updateUI(state, elements) {
    const {
        setupCard,
        badge,
        statusText,
        message,
        enableButton,
        retryButton,
    } = elements;

    if (!setupCard || !badge || !statusText || !message || !enableButton || !retryButton) {
        return;
    }

    if (state.allGranted) {
        setupCard.classList.add("hidden");
        badge.textContent = "Enabled";
        badge.classList.remove("status-not-enabled");
        badge.classList.add("status-enabled");
        statusText.textContent = "Emergency permissions enabled. SOS will work instantly.";
        message.textContent = "Permission granted for camera and location.";
        message.classList.remove("hidden", "error");
        message.classList.add("success");
        enableButton.classList.add("hidden");
        retryButton.classList.add("hidden");
        return;
    }

    setupCard.classList.remove("hidden");

    badge.textContent = "Not Enabled";
    badge.classList.remove("status-enabled");
    badge.classList.add("status-not-enabled");

    if (!state.secureContext) {
        statusText.textContent = "Permissions cannot be enabled on non-HTTPS production pages.";
        message.textContent = "Use HTTPS in production. Localhost works for development.";
        message.classList.remove("hidden", "success");
        message.classList.add("error");
    } else {
        statusText.textContent = "Enable camera and location now so SOS works instantly during emergencies.";
        message.textContent = "Permissions are not fully enabled yet.";
        message.classList.remove("hidden", "success");
        message.classList.add("error");
    }

    enableButton.classList.remove("hidden");
    retryButton.classList.remove("hidden");
}

window.PermissionManager = {
    checkPermissions,
    requestPermissions,
    updateUI,
};
