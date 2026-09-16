const fs = require('fs');

let code = fs.readFileSync('src/components/InstagramReelFeed.tsx', 'utf8');

const regex = /\{\/\* Background Thumbnail Image with subtle hover zoom \*\/\}\s*<img\s*src=\{reel\.videoThumb\}\s*alt=\{reel\.title\}\s*className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"\s*referrerPolicy="no-referrer"\s*\/>/;

const replacement = `{/* Background Thumbnail Image with subtle hover zoom */}
              {reel.videoUrl && !isInstagramUrl(reel.videoUrl) ? (
                <video
                  src={reel.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                />
              ) : (
                <img
                  src={reel.videoThumb}
                  alt={reel.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              )}`;

if (code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/InstagramReelFeed.tsx', code);
  console.log("Reel feed grid updated");
} else {
  console.log("Could not find regex in InstagramReelFeed.tsx");
}
