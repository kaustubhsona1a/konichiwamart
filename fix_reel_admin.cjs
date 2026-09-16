const fs = require('fs');

let code = fs.readFileSync('src/components/admin/ReelsManager.tsx', 'utf8');

const regex1 = /<img\s*src=\{reel\.videoThumb\}\s*alt=\{reel\.title\}\s*className="w-full h-full object-cover"\s*referrerPolicy="no-referrer"\s*\/>/g;

const replacement1 = `{reel.videoUrl && !reel.videoUrl.includes('instagram.com') ? (
                        <video src={reel.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                      ) : (
                        <img 
                          src={reel.videoThumb} 
                          alt={reel.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}`;

code = code.replace(regex1, replacement1);

const regex2 = /<img\s*src=\{editingReel\.videoThumb\}\s*alt="Thumbnail preview"\s*className="w-full h-full object-cover"\s*referrerPolicy="no-referrer"\s*\/>/g;

const replacement2 = `{editingReel.videoUrl && !editingReel.videoUrl.includes('instagram.com') ? (
                      <video src={editingReel.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                    ) : (
                      <img
                        src={editingReel.videoThumb}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}`;

code = code.replace(regex2, replacement2);

fs.writeFileSync('src/components/admin/ReelsManager.tsx', code);
console.log("ReelsManager video preview updated");
