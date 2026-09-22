const sharp = require("sharp");
const path = "c:/Users/HP/Downloads/Glass/glass-waitlist/src/assets/auth-background.webp";
sharp(path)
  .metadata()
  .then((m) => {
    console.log(
      JSON.stringify({ width: m.width, height: m.height, aspect: (m.width / m.height).toFixed(3) }),
    );
    return sharp(path)
      .resize({ height: 500 })
      .toFile("c:/Users/HP/Downloads/Glass/glass-waitlist/_bg_small.png");
  })
  .then(() => console.log("resized"));
