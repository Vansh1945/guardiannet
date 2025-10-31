const path = require("path");
const player = require("play-sound")({});

exports.playSoundAlert = () => {
    const alertSound = path.join(__dirname, "../assets/alert.mp3");
    // console.log("🔊 Trying to play sound:", alertSound);

    player.play(alertSound, (err) => {
        if (err) {
            //   console.error("Error playing sound:", err);
        } else {
            //   console.log("Sound played successfully!");
        }
    });
};
