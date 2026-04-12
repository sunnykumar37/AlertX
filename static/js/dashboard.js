function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i += 1) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const sosButton = document.getElementById("sosButton");
const statusEl = document.getElementById("sosStatus");
const video = document.getElementById("cameraPreview");
const canvas = document.getElementById("captureCanvas");
const setupCard = document.getElementById("emergencySetupCard");
const permissionStatusBadge = document.getElementById("permissionStatusBadge");
const permissionStatusText = document.getElementById("permissionStatusText");
const permissionMessage = document.getElementById("permissionMessage");
const enablePermissionsBtn = document.getElementById("enablePermissionsBtn");
const retryPermissionsBtn = document.getElementById("retryPermissionsBtn");
const SOS_COOLDOWN_MS = 5000;
const permissionManager = window.PermissionManager || createLocalPermissionManager();

function createLocalPermissionManager() {
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
        statusText.textContent = "Enable camera and location now so SOS works instantly during emergencies.";
        message.textContent = "Permissions are not fully enabled yet.";
        message.classList.remove("hidden", "success");
        message.classList.add("error");
        enableButton.classList.remove("hidden");
        retryButton.classList.remove("hidden");
    }

    async function checkPermissions() {
        const cameraGranted = parseStoredFlag(CAMERA_KEY);
        const locationGranted = parseStoredFlag(LOCATION_KEY);
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

        const allGranted = cameraGranted && locationGranted;
        return {
            cameraGranted,
            locationGranted,
            allGranted,
            status: allGranted ? "success" : "warning",
            message: allGranted
                ? "Emergency permissions enabled. SOS will work instantly."
                : "Some permissions are still missing. Please retry and allow access.",
        };
    }

    return {
        checkPermissions,
        requestPermissions,
        updateUI,
    };
}

function wait(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function setupElements() {
    return {
        setupCard,
        badge: permissionStatusBadge,
        statusText: permissionStatusText,
        message: permissionMessage,
        enableButton: enablePermissionsBtn,
        retryButton: retryPermissionsBtn,
    };
}

function initializeDeleteConfirmations() {
    const forms = document.querySelectorAll(".confirm-delete-form");
    forms.forEach((form) => {
        form.addEventListener("submit", (event) => {
            const message = form.getAttribute("data-confirm-message") || "Are you sure you want to delete this item?";
            if (!window.confirm(message)) {
                event.preventDefault();
            }
        });
    });
}

async function initCamera() {
    try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            statusEl.textContent = "Camera is not supported in this browser.";
            return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
            audio: false,
        });
        video.classList.remove("hidden");
        video.srcObject = stream;
    } catch (err) {
        statusEl.textContent = "Camera unavailable. SOS will still include location.";
    }
}

function captureImageBlob() {
    return new Promise((resolve) => {
        if (!video.srcObject) {
            resolve(null);
            return;
        }

        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.9);
    });
}

function getLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation unavailable"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position.coords),
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
    });
}

async function sendSOS() {
    try {
        sosButton.disabled = true;

        if (!permissionManager) {
            statusEl.textContent = "Permission module failed to load. Refresh the page and try again.";
            return;
        }

        const permissionState = await permissionManager.checkPermissions();
        permissionManager.updateUI(permissionState, setupElements());
        if (!permissionState.allGranted) {
            statusEl.textContent = "Please enable permissions first for emergency use.";
            return;
        }

        statusEl.textContent = "🚨 Sending alert...";

        const [coords, imageBlob] = await Promise.all([
            getLocation(),
            captureImageBlob(),
        ]);

        if (!coords || coords.latitude == null || coords.longitude == null) {
            throw new Error("Location is missing. Enable location permission and retry.");
        }

        if (!imageBlob) {
            throw new Error("Camera image is missing. Enable camera permission and retry.");
        }

        const formData = new FormData();
        formData.append("latitude", coords.latitude);
        formData.append("longitude", coords.longitude);
        formData.append("image", imageBlob, `sos_${Date.now()}.jpg`);

        const response = await fetch("/send-sos", {
            method: "POST",
            headers: {
                "X-CSRFToken": getCookie("csrftoken"),
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to send SOS");
        }

        statusEl.textContent = data.message || "Alert sent successfully";
    } catch (err) {
        statusEl.textContent = `SOS failed: ${err.message}`;
    } finally {
        statusEl.textContent = `${statusEl.textContent} (cooldown 5s)`;
        await wait(SOS_COOLDOWN_MS);
        sosButton.disabled = false;
    }
}

async function runPermissionSetup() {
    if (!permissionManager) {
        statusEl.textContent = "Permission module failed to load. Refresh the page and try again.";
        return;
    }

    const setupResult = await permissionManager.requestPermissions();
    permissionManager.updateUI(setupResult, setupElements());

    permissionMessage.textContent = setupResult.message;
    permissionMessage.classList.remove("hidden");
    permissionMessage.classList.remove("success", "error");
    permissionMessage.classList.add(setupResult.status === "success" ? "success" : "error");

    if (setupResult.allGranted) {
        statusEl.textContent = "Emergency permissions enabled. SOS will work instantly.";
        await initCamera();
    } else {
        statusEl.textContent = "Please enable permissions first for emergency use.";
    }
}

async function initializeDashboard() {
    if (!permissionManager) {
        statusEl.textContent = "Permission module failed to load. Refresh the page and try again.";
        return;
    }

    const state = await permissionManager.checkPermissions();
    permissionManager.updateUI(state, setupElements());

    if (state.allGranted) {
        statusEl.textContent = "Emergency permissions enabled. SOS will work instantly.";
        await initCamera();
    } else {
        video.classList.add("hidden");
    }
}

if (sosButton) {
    initializeDashboard();
    sosButton.addEventListener("click", sendSOS);
}

if (enablePermissionsBtn) {
    enablePermissionsBtn.addEventListener("click", runPermissionSetup);
}

if (retryPermissionsBtn) {
    retryPermissionsBtn.addEventListener("click", runPermissionSetup);
}

initializeDeleteConfirmations();
