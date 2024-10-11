document.getElementById('slider1').addEventListener('input', function() {
    document.getElementById('slider1Value').innerText = this.value;
});

function sendData() {
    const sliderValue = document.getElementById('slider1').value;
    const textValue = document.getElementById('inputText').value;
    
    // Send data to Grasshopper via API or WebSocket
    console.log('Slider Value:', sliderValue);
    console.log('Text Input:', textValue);
    
    // You will need a method to communicate with the Grasshopper script (e.g., using Rhino.Compute or a local server)
}
