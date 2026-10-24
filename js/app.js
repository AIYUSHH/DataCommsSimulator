const status = document.getElementById("connection-status");
const disconnectButton = document.getElementById("connection-button");
let isConnected = true;
const byteVisualiser = document.getElementById("byte-visualiser");
const packetLab = document.getElementById("packetization-view");
const packetButton = document.getElementById("packetization-button");
let confirmedMessage = "";
const reverseButton = document.getElementById("back-to-menu");

const messageInput = document.getElementById("message-input");
const encodingOutput = document.getElementById("encodingout");
const binaryOutput = document.getElementById("binary-output");

const payloadInput = document.getElementById("payload-size");
const createPacketsButton = document.getElementById("create-packets-button");
const packetOutput = document.getElementById("packet-output");

const sourceEncodingButton =
    document.getElementById("source-encoding-button");

const sourceEncodingView =
    document.getElementById("source-encoding-view");

const encodingBackButton =
    document.getElementById("encoding-back-button");

const encodingAnimation =
    document.getElementById("encoding-animation");

const operationSelection =
    document.getElementById("operation-selection");

const byteStream = document.getElementById("byte-stream");

const transmitButton = document.getElementById("transmit-packets-button");
const travellingPacket = document.getElementById("travelling-packet");
const transmissionStatus = document.getElementById("transmission-status");

const travellingAck = document.getElementById("travelling-ack");
const travellingAckLabel = document.getElementById("travelling-ack-label");

const sender = document.getElementById("sender");
const receiver = document.getElementById("receiver");

const receiverProgress = document.getElementById("receiver-progress");
const receivedPackets = document.getElementById("received-packets");
const reassembledMessage = document.getElementById("reassembled-message");
const deliveryOrder = document.getElementById("delivery-order");
let isTransmitting = false;
let packets = [];
const packetLossInput = document.getElementById("packet-loss");
const MAX_RETRIES = 3;
function resetReceiver() {
    receiverProgress.textContent = "Waiting for incoming packets...";
    receivedPackets.innerHTML = "";

    reassembledMessage.innerHTML =
        "<p>Original message will appear here.</p>";
}

let isAnimatingPackets = false;
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function displayByteStream() {
    byteStream.innerHTML = "";

    const bytes = Array.from(
        new TextEncoder().encode(confirmedMessage)
    );

    bytes.forEach((byte, index) => {
        const box = document.createElement("div");
        box.classList.add("stream-byte");

        box.innerHTML = `
            <span>Byte ${index + 1}</span>
            <strong>${byte.toString(16).padStart(2, "0")}</strong>
        `;

        byteStream.appendChild(box);
    });
}

async function animateEncoding() {
    encodingAnimation.innerHTML = "";

    const characters = Array.from(confirmedMessage);
    const encoder = new TextEncoder();
    for (let i = 0; i < characters.length; i++) {
        const character = characters[i];

        const bytes = Array.from(
            encoder.encode(character)
        );

        const binary = bytes
            .map(byte => byte.toString(2).padStart(8, "0"))
            .join(" ");

        const hexadecimal = bytes
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join(" ");

        const row = document.createElement("div");
        row.classList.add("encoding-character");

        row.innerHTML = `
        <div class="character-symbol">${character}</div>
        <div class="character-details">
            <p>Character position: ${i + 1}</p>
            <p>UTF-8 bytes: ${bytes.length}</p>
            <p>Hexadecimal: ${hexadecimal}</p>
            <p>Binary: ${binary}</p>
        </div>
    `;

        encodingAnimation.appendChild(row);

        await delay(500);

    }
}
disconnectButton.addEventListener("click", function () {

    if (isConnected) {
        status.classList.remove("connected");
        status.classList.add("disconnected");
        status.textContent = "Disconnected";
        disconnectButton.textContent = "Connect";
    }
    else {
        status.classList.remove("disconnected");
        status.classList.add("connected");
        status.textContent = "Connected";
        disconnectButton.textContent = "Disconnect";
    }
    isConnected = !isConnected;
})

function encodeMessage() {
    const message = messageInput.value;
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(message));
    const byteBoxes = bytes.map(
        (byte, index) => {
            const hexByte = byte.toString(16).padStart(2, "0");
            const binaryByte = byte.toString(2).padStart(8, "0");
            return `<div class="byte-box">
                        <p>Byte ${index + 1} :</p>
                        <p>Decimal : ${byte}</p>
                        <p>Binary : ${binaryByte}</p>
                        <p>Hexadecimal : ${hexByte}</p>
                    </div>`;
        }
    )
    byteVisualiser.innerHTML = byteBoxes.join("");
}


messageInput.addEventListener("input", encodeMessage);

const finishButton = document.getElementById("finish-message");

finishButton.addEventListener("click", function () {
    const message = messageInput.value.trim();

    if (message === "") {
        alert("Please Enter a message!!");
        return;
    }
    confirmedMessage = message;

    document.getElementById("message-editor").hidden = true;
    document.getElementById("operation-selection").hidden = false;

});

packetButton.addEventListener("click", function () {
    document.getElementById("operation-selection").hidden = true;
    document.getElementById("packetization-view").hidden = false;
})

reverseButton.addEventListener("click", function () {
    document.getElementById("operation-selection").hidden = false;
    document.getElementById("packetization-view").hidden = true;
})

createPacketsButton.addEventListener("click", async function () {
    if (isAnimatingPackets) {
        return;
    }
    const payloadSize = Number(payloadInput.value);
    if (!Number.isInteger(payloadSize) || payloadSize < 1) {
        alert('Please Enter a Positive Integer.');
        return;
    }

    isAnimatingPackets = true;
    createPacketsButton.disabled = true;

    const bytes = Array.from(new TextEncoder().encode(confirmedMessage));
    packets = [];
    for (let i = 0; i < bytes.length; i += payloadSize) {
        packets.push(bytes.slice(i, i + payloadSize));
    }

    const packetHTML = packets.map((packet, index) => {
        const hexPayload = packet
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join(" ");

        return `
    <div class="packet">
        <h3>Packet ${index + 1}</h3>

        <div class="packet-header">
            <h4>Header</h4>
            <p>Sequence number: ${index + 1}</p>
            <p>Payload length: ${packet.length} bytes</p>
        </div>

        <div class="packet-payload">
            <h4>Payload</h4>
            <p>Hex data: ${hexPayload}</p>
        </div>
    </div>
`;
    });

    packetOutput.innerHTML = "";
    const streamBytes = byteStream.querySelectorAll(".stream-byte");

    for (let packetIndex = 0; packetIndex < packets.length; packetIndex++) {

        // 1. Clear previous highlighting
        streamBytes.forEach(box => {
            box.classList.remove("selected");
        });

        // 2. Find the starting byte index
        const start = packetIndex * payloadSize;

        // 3. Highlight the bytes belonging to this packet
        for (let j = 0; j < packets[packetIndex].length; j++) {
            streamBytes[start + j].classList.add("selected");
        }

        // 4. Let the user see the highlighted bytes
        await delay(450);

        // 5. Display the current packet card
        packetOutput.insertAdjacentHTML(
            "beforeend",
            packetHTML[packetIndex]
        );

        // 6. Pause before assembling the next packet
        await delay(450);
    }
    isAnimatingPackets = false;
    createPacketsButton.disabled = false;
})

sourceEncodingButton.addEventListener("click", function () {
    operationSelection.hidden = true;
    sourceEncodingView.hidden = false;
    animateEncoding();
});

encodingBackButton.addEventListener("click", function () {
    sourceEncodingView.hidden = true;
    operationSelection.hidden = false;
});

packetButton.addEventListener("click", function () {
    document.getElementById("operation-selection").hidden = true;
    document.getElementById("packetization-view").hidden = false;
    displayByteStream();
});


async function transmitPackets() {
    if (isTransmitting) {
        return;
    }

    isTransmitting = true;
    transmitButton.disabled = true;

    try {
        const packetCards = packetOutput.querySelectorAll(".packet");

        if (packetCards.length === 0) {
            alert("Create packets before transmitting!");
            return;
        }
        const deliveryIndices = Array.from(
            { length: packets.length },
            (_, index) => index
        );

        if (deliveryOrder.value === "reverse") {
            deliveryIndices.reverse();
        }
        resetReceiver();
        const receivedPayloads = new Array(packets.length);

        transmitButton.disabled = true;
        travellingPacket.style.opacity = "1";

        packetCards.forEach(card => {
            card.classList.remove("delivered");
        });

        sender.querySelector("p").textContent = "Transmitting...";
        receiver.querySelector("p").textContent = "Waiting for packets";

        for (const i of deliveryIndices) {

            let delivered = false;
            let attempts = 0;

            while (!delivered && attempts < MAX_RETRIES + 1) {
                attempts++;

                const packetNumber = i + 1;
                travellingPacket.querySelector("span").textContent =
                    `P${packetNumber}`;


                transmissionStatus.textContent =
                    `Packet ${packetNumber} delivered. Sending ACK...`;

                travellingAckLabel.textContent = `ACK ${packetNumber}`;

                // Start at the receiver's end.
                travellingAck.style.transition = "none";
                travellingAck.style.left = "100%";
                travellingAck.style.opacity = "1";

                // Force the browser to apply the starting position.
                void travellingAck.offsetWidth;

                // Animate back toward the sender.
                travellingAck.style.transition = "left 700ms ease-in-out";
                travellingAck.style.left = "0%";

                await delay(750);

                // Hide the ACK after it reaches the sender.
                travellingAck.style.opacity = "0";

                transmissionStatus.textContent =
                    `Packet ${packetNumber} delivered. ACK received.`;

                await delay(350);

                travellingPacket.style.transition = "none";
                travellingPacket.style.left = "0%";
                travellingPacket.style.opacity = "1";
                void travellingPacket.offsetWidth;

                travellingPacket.style.transition = "left 1000ms ease-in-out";
                travellingPacket.style.left = "100%";

                await delay(1050);

                if (packetIsLost()) {
                    transmissionStatus.textContent =
                        `Packet ${packetNumber} was lost. ${attempts <= MAX_RETRIES ? "Retrying..." : "Maximum attempts reached."}`;

                    travellingPacket.style.opacity = "0";
                    receiverProgress.textContent =
                        `Packet ${packetNumber} did not arrive. Waiting for retransmission.`;
                    await delay(500);
                    continue;
                }

                delivered = true;

                packetCards[i].classList.add("delivered");

                const payload = packets[i];
                receivedPayloads[i] = payload;

                const receivedCard = document.createElement("div");
                receivedCard.classList.add("received-packet");
                receivedCard.innerHTML = `
            <strong>Packet ${packetNumber} received</strong>
            <span>Hex: ${payload
                        .map(byte => byte.toString(16).padStart(2, "0"))
                        .join(" ")}</span>
        `;
                receivedPackets.appendChild(receivedCard);

                receiverProgress.textContent =
                    `Received ${receivedPayloads.filter(p => p !== undefined).length} of ${packets.length} packets`;

                transmissionStatus.textContent =
                    `Packet ${packetNumber} delivered. ACK received.`;

                await delay(350);
            }

            if (!delivered) {
                throw new Error(`Packet ${i + 1} failed after ${attempts} attempts.`);
            }

        }

        travellingPacket.style.opacity = "0";

        sender.querySelector("p").textContent = "Transmission complete";
        receiver.querySelector("p").textContent = "All packets received";
        if (receivedPayloads.some(payload => payload === undefined)) {
            receiver.querySelector("p").textContent =
                "Message incomplete — some packets were not received.";

            reassembledMessage.textContent =
                "Cannot reconstruct the original message.";

            return;
        }

        const receivedBytes = receivedPayloads.flat();

        const decodedMessage = new TextDecoder().decode(
            new Uint8Array(receivedBytes)
        );

        reassembledMessage.innerHTML = `
    <p>Reassembled message</p>
    <p class="reassembled-text"></p>
`;

        reassembledMessage.querySelector(".reassembled-text").textContent =
            decodedMessage;
        transmissionStatus.textContent =
            `Transmission complete: ${packetCards.length} packets delivered.`;
    } catch (error) {
        console.error("Transmission failed:", error);

        travellingPacket.style.opacity = "0";
        sender.querySelector("p").textContent = "Transmission failed";
        receiver.querySelector("p").textContent = "Message incomplete";
        receiverProgress.textContent = error.message;
        reassembledMessage.textContent =
            "Cannot reconstruct the original message.";

        transmissionStatus.textContent =
            "Transmission failed. Please try again.";
    } finally {
        isTransmitting = false;
        transmitButton.disabled = false;
    }
}

function packetIsLost() {
    const lossProbability = Number(packetLossInput.value) / 100;

    return Math.random() < lossProbability;
}


transmitButton.addEventListener("click", transmitPackets);