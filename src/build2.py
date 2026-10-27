s=open('app.src.html').read()
s=s.replace('%%ROOM%%',open('room_part.js').read())
s=s.replace('%%G11%%',open('font/Galmuri11.b64').read()).replace('%%G11B%%',open('font/Galmuri11-Bold.b64').read())
open('app.html','w').write(s)
