document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const statusDiv = document.getElementById('status');
    const canvas = document.getElementById('spectrogram');
    const ctx = canvas.getContext('2d');
    
    let audioContext;
    let analyser;
    let microphone;
    let isRunning = false;
    let animationId;
    let spectrogramData = [];
    const maxSpectrogramWidth = canvas.width;
    
    // Initialize the spectrogram data array
    function initSpectrogramData() {
        spectrogramData = [];
        for (let i = 0; i < maxSpectrogramWidth; i++) {
            spectrogramData.push(new Uint8Array(analyser.frequencyBinCount));
        }
    }
    
    // Draw the spectrogram
    function drawSpectrogram() {
        // Get the current frequency data
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(frequencyData);
        
        // Add new data to the spectrogram (shift old data left)
        spectrogramData.shift();
        spectrogramData.push(frequencyData);
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw each column of the spectrogram
        for (let x = 0; x < spectrogramData.length; x++) {
            const columnData = spectrogramData[x];
            
            for (let y = 0; y < columnData.length; y++) {
                // Normalize the value (0-255) to a color
                const value = columnData[y];
                const hue = 240 - (value / 255 * 240); // Blue (low) to Red (high)
                const saturation = 100;
                const lightness = value / 510 * 100; // Darker for lower values
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(x, canvas.height - y - 1, 1, 1);
            }
        }
        
        // Add frequency labels on the y-axis
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        const sampleRate = audioContext.sampleRate;
        for (let freq = 0; freq <= 10000; freq += 1000) {
            const y = canvas.height - (freq / (sampleRate / 2) * canvas.height);
            ctx.fillText(freq + ' Hz', 5, y - 5);
        }
        
        // Continue the animation
        animationId = requestAnimationFrame(drawSpectrogram);
    }
    
    // Start the audio processing
    async function start() {
        try {
            statusDiv.textContent = "Initializing audio...";
            
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            
            // Set up the analyser
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            
            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            microphone = audioContext.createMediaStreamSource(stream);
            
            // Connect the microphone to the analyser
            microphone.connect(analyser);
            
            // Initialize spectrogram data
            initSpectrogramData();
            
            // Start drawing
            drawSpectrogram();
            
            // Update UI
            isRunning = true;
            startButton.disabled = true;
            stopButton.disabled = false;
            statusDiv.textContent = "Listening to microphone...";
        } catch (error) {
            statusDiv.textContent = "Error: " + error.message;
            console.error(error);
        }
    }
    
    // Stop the audio processing
    function stop() {
        if (isRunning) {
            cancelAnimationFrame(animationId);
            
            // Disconnect microphone
            if (microphone) {
                microphone.disconnect();
            }
            
            // Close audio context
            if (audioContext) {
                audioContext.close();
            }
            
            // Update UI
            isRunning = false;
            startButton.disabled = false;
            stopButton.disabled = true;
            statusDiv.textContent = "Stopped. Click 'Start' to begin again.";
        }
    }
    
    // Event listeners
    startButton.addEventListener('click', start);
    stopButton.addEventListener('click', stop);
});