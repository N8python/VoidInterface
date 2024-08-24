async function getNgrokUrl() {
    const response = await fetch('https://gist.githubusercontent.com/N8python/8275c17146c0cf7111ab8f55e1eaa4b8/raw/c35c9c3042640571abfc25c3694a52521d9f60ca/voidhead.txt');
    const url = await response.text();
    return url.trim(); // Remove any whitespace
}
document.addEventListener('DOMContentLoaded', async() => {
    const chatArea = document.getElementById('chat-area');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');

    const API_URL = await getNgrokUrl();
    const MODEL = 'N8/Voidhead-9B/Voidhead-9B-Q8_0.gguf';

    let messages = [];
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.zIndex = '-1';
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    let generatingResponse = false;

    // Tentacle class
    class Tentacle {
        constructor() {
            this.segments = [];
            this.numSegments = 20 + Math.floor(Math.random() * 30);
            for (let i = 0; i < this.numSegments; i++) {
                this.segments.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    angle: Math.random() * Math.PI * 2,
                    length: 5 + Math.random() * 15
                });
            }
            this.HEAD_RADIUS = 10;
            this.offset = Math.random() * Math.PI * 2;
            this.lashOutTimer = 0;
            this.lashOutDuration = 0;
            this.targetVoidfish = null;
            this.lashOutCooldown = 100 + 200 * Math.random();
        }

        update(voidfish) {
            if (generatingResponse) return;
            const head = this.segments[0];

            // Check for nearby voidfish
            if (this.lashOutTimer <= 0 && this.lashOutCooldown <= 0) {
                for (let fish of voidfish) {
                    const dx = fish.x - head.x;
                    const dy = fish.y - head.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 100) {
                        this.targetVoidfish = fish;
                        this.lashOutTimer = 40 + 20 * Math.random();
                        this.lashOutDuration = 20 + 10 * Math.random();
                        this.lashOutCooldown = 100 + 200 * Math.random();
                        this.lastHeadPos = { x: head.x, y: head.y };
                        // Solve for the offset that will immediately make Math.sin(performance.now() * 0.001 + this.offset) go to 1
                        // So solve
                        // sin(performance.now() * 0.001 + offset) = 1
                        // performance.now() * 0.001 + offset = PI / 2

                        this.offset = Math.asin(1 - 0.3 * Math.random()) - performance.now() * 0.001;
                        break;
                    }
                }
            }
            this.lashOutCooldown--;

            // Lash out behavior
            if (this.lashOutTimer > 0) {
                this.lashOutTimer--;
                if (this.lashOutDuration > 0) {
                    this.lashOutDuration--;
                    if (this.targetVoidfish) {
                        const dx = this.targetVoidfish.x - head.x;
                        const dy = this.targetVoidfish.y - head.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        head.angle = Math.atan2(dy, dx);
                        const speed = this.lashOutDuration / 4 * Math.min(distance, 10) / 10;
                        head.x += Math.cos(head.angle) * speed;
                        head.y += Math.sin(head.angle) * speed;
                    }
                } else {
                    // Retract
                    const dx = this.lastHeadPos.x - head.x;
                    const dy = this.lastHeadPos.y - head.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    head.angle = Math.atan2(dy, dx);
                    const speed = (this.lashOutTimer / 4) * Math.min(distance, 10) / 10;
                    head.x += Math.cos(head.angle) * speed;
                    head.y += Math.sin(head.angle) * speed;
                }
            } else {
                // Normal movement
                head.angle += (Math.random() - 0.5) * 0.2;
                head.x += Math.cos(head.angle) * 0.5;
                head.y += Math.sin(head.angle) * 0.5;
            }
            let headHit = false;
            // Boundary check for head

            if (head.x < this.HEAD_RADIUS) head.x = this.HEAD_RADIUS, headHit = true;
            if (head.x > canvas.width - this.HEAD_RADIUS) head.x = canvas.width - this.HEAD_RADIUS, headHit = true;
            if (head.y < this.HEAD_RADIUS) head.y = this.HEAD_RADIUS, headHit = true;
            if (head.y > canvas.height - this.HEAD_RADIUS) head.y = canvas.height - this.HEAD_RADIUS, headHit = true;

            if (headHit) {
                head.angle += Math.PI / 3 + Math.random() * Math.PI / 3;
            }
            // Update other segments
            for (let i = 1; i < this.segments.length; i++) {
                const segment = this.segments[i];
                const prevSegment = this.segments[i - 1];
                const dx = prevSegment.x - segment.x;
                const dy = prevSegment.y - segment.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > segment.length) {
                    const angle = Math.atan2(dy, dx);
                    segment.x = prevSegment.x - Math.cos(angle) * segment.length;
                    segment.y = prevSegment.y - Math.sin(angle) * segment.length;
                }
            }

            this.offset += (Math.random() - 0.5) * 0.01;
        }

        draw(ctx) {
            ctx.beginPath();
            ctx.moveTo(this.segments[0].x, this.segments[0].y);
            ctx.lineCap = 'round';
            for (let i = 1; i < this.segments.length; i++) {
                const segment = this.segments[i];
                ctx.lineTo(segment.x, segment.y);
            }
            ctx.strokeStyle = `rgba(255, 0, 0, ${0.15 + Math.cos(performance.now() * 0.001 - this.offset) * 0.05})`;
            ctx.lineWidth = 2 + Math.random() * 3;
            ctx.stroke();

            // Draw tentacle head
            const head = this.segments[0];
            ctx.beginPath();
            ctx.arc(head.x, head.y, this.HEAD_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 0, 0, ${generatingResponse ? 0.5 : 0.3 + Math.sin(performance.now() * 0.001 + this.offset) * 0.2})`;
            ctx.fill();

            // Head glow effect
            if (!generatingResponse) {
                let lashingOut = this.lashOutTimer > 0 && this.lashOutDuration > 0;
                for (let i = 0; i < 10; i++) {
                    ctx.beginPath();
                    ctx.arc(head.x, head.y, this.HEAD_RADIUS * (lashingOut ? 2 : 1) + i * 2, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 0, 0, ${(0.02 + Math.sin(performance.now() * 0.001 + this.offset) * 0.02) * (lashingOut ? 2 : 1) })`;
                    ctx.fill();
                }
            } else {
                const size = 50 + 40 * Math.sin(performance.now() * 0.01);
                for (let i = 0; i < 5; i++) {
                    ctx.beginPath();
                    ctx.arc(head.x, head.y, this.HEAD_RADIUS + (size - this.HEAD_RADIUS) * (i / 4), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 0, 0, 0.05)`;
                    ctx.fill();
                }
            }
        }
    }

    const tentacles = Array(5).fill().map(() => new Tentacle());
    class Voidfish {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = Math.random() * 2 - 1;
            this.vy = Math.random() * 2 - 1;
            this.size = 5 + Math.random() * 5;
            this.angle = Math.atan2(this.vy, this.vx);
            this.oldPosition = { x: this.x, y: this.y };
        }

        update(voidfish) {
            if (!generatingResponse && this.grappled) {
                let nearestTentacle = null;
                let nearestDistance = Infinity;
                for (let tentacle of tentacles) {
                    const dx = tentacle.segments[0].x - this.x;
                    const dy = tentacle.segments[0].y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestTentacle = tentacle;
                    }
                }
                const dx = nearestTentacle.segments[0].x - this.x;
                const dy = nearestTentacle.segments[0].y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const pushOut = 10;
                this.vx += -dx / distance * pushOut;
                this.vy += -dy / distance * pushOut;
            }
            this.grappled = false;
            if (generatingResponse) {
                // Find nearest tentacle
                let nearestTentacle = null;
                let nearestDistance = Infinity;
                for (let tentacle of tentacles) {
                    const dx = tentacle.segments[0].x - this.x;
                    const dy = tentacle.segments[0].y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestTentacle = tentacle;
                    }
                }
                // Move towards nearest tentacle till at a certain distance - 90
                if (nearestTentacle) {
                    const dx = nearestTentacle.segments[0].x - this.x;
                    const dy = nearestTentacle.segments[0].y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    /*const speed = 5;
                    this.vx = Math.cos(Math.atan2(dy, dx)) * speed;
                    this.vy = Math.sin(Math.atan2(dy, dx)) * speed;*/
                    if (distance > 90) {
                        this.vx += dx / distance * 0.1;
                        this.vy += dy / distance * 0.1;
                    } else {
                        // Target the perpindicular direction
                        this.vx += -dy / distance * 0.1;
                        this.vy += dx / distance * 0.1;
                        // Rotate slightly relative to tentacle
                        const newTheta = Math.atan2(dy, dx) + 0.1;
                        this.x = nearestTentacle.segments[0].x - Math.cos(newTheta) * 90;
                        this.y = nearestTentacle.segments[0].y - Math.sin(newTheta) * 90;
                        this.grappled = true;

                    }
                }
            }
            if (this.scatterTimer > 0) {
                // Scattering behavior
                this.scatterTimer--;
                const dx = this.scatterPoint.x - this.x;
                const dy = this.scatterPoint.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                this.vx -= dx / distance * 0.1;
                this.vy -= dy / distance * 0.1;

            } else {
                // Normal boid behavior
                let avgVx = 0,
                    avgVy = 0,
                    avgX = 0,
                    avgY = 0,
                    count = 0;
                let separationX = 0,
                    separationY = 0;

                for (let other of voidfish) {
                    if (other !== this) {
                        let dx = other.x - this.x;
                        let dy = other.y - this.y;
                        let distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < 50) {
                            avgVx += other.vx;
                            avgVy += other.vy;
                            avgX += other.x;
                            avgY += other.y;
                            count++;

                            if (distance < 25) {
                                separationX -= dx;
                                separationY -= dy;
                            }
                        }
                    }
                }

                if (count > 0) {
                    // Alignment
                    this.vx += (avgVx / count - this.vx) * 0.005;
                    this.vy += (avgVy / count - this.vy) * 0.005;

                    // Cohesion
                    this.vx += (avgX / count - this.x) * 0.005;
                    this.vy += (avgY / count - this.y) * 0.005;

                    // Separation
                    this.vx += separationX * 0.01;
                    this.vy += separationY * 0.01;
                }
                // Avoid walls
                if (this.x < 50) this.vx += 0.02;
                if (this.x > canvas.width - 50) this.vx -= 0.02;
                if (this.y < 50) this.vy += 0.02;
                if (this.y > canvas.height - 50) this.vy -= 0.02;


                // Check for nearby tentacles
                for (let tentacle of tentacles) {
                    let dx = tentacle.segments[0].x - this.x;
                    let dy = tentacle.segments[0].y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 50 && tentacle.lashOutTimer > 0 && tentacle.lashOutDuration > 0) {
                        // Scatter!
                        this.scatterTimer = 60;
                        /* let angle = Math.atan2(dy, dx) + Math.PI;
                         let speed = 5 + Math.random() * 3;
                         this.vx = Math.cos(angle) * speed;
                         this.vy = Math.sin(angle) * speed;*/
                        this.scatterPoint = { x: tentacle.segments[0].x, y: tentacle.segments[0].y };

                        break;
                    }
                }
            }

            // Move
            this.x += this.vx;
            this.y += this.vy;

            // Dont go over border 
            // Bounce off walls
            if (this.x < this.size || this.x > canvas.width - this.size) {
                this.vx *= -1;
            }
            if (this.y < this.size || this.y > canvas.height - this.size) {
                this.vy *= -1;
            }
            if (this.x < this.size) this.x = this.size;
            if (this.x > canvas.width - this.size) this.x = canvas.width - this.size;
            if (this.y < this.size) this.y = this.size;
            if (this.y > canvas.height - this.size) this.y = canvas.height - this.size;


            // Limit speed
            let speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > 1) {
                const magnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                this.vx = (this.vx / speed) * (magnitude - 0.1);
                this.vy = (this.vy / speed) * (magnitude - 0.1);
            }
        }

        draw(ctx) {
            /*ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(performance.now() * 0.001) * 0.1})`;
            ctx.fill();

            // Glow effect
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size + i * 2, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${0.05 - i * 0.01})`;
                ctx.fill();
            }*/
            ctx.beginPath();
            // Stretch ellipse in the direction of movement
            const newAngle = Math.atan2(this.y - this.oldPosition.y, this.x - this.oldPosition.x);
            // Check which way is shorter
            const lerpFactor = this.grappled ? 1.0 : 0.1;
            let angle = this.angle;
            if (Math.abs(newAngle - this.angle) < Math.PI) {
                angle = angle + (newAngle - angle) * lerpFactor;
            } else {
                angle = angle + (newAngle - angle + Math.PI * 2) * lerpFactor;
            }
            this.angle = angle;
            // Find best way to rotate


            ctx.ellipse(this.x, this.y, this.size, this.size * 0.5, angle, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 255, 255, ${0.1 + Math.sin(performance.now() * 0.001) * 0.1})`;
            ctx.fill();
            // Glow effect
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.size + i * 2, (this.size + i * 2) * 0.5, angle, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0, 255, 255, ${0.05 - i * 0.01 + (this.grappled ? 0.1 : 0)})`;
                ctx.fill();
            }
            this.oldPosition = { x: this.x, y: this.y };
        }
    }
    const voidfish = Array(100).fill().map(() => new Voidfish());


    function drawGlitch() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Random static
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;
        const lenData = data.length;
        for (let i = 0; i < lenData; i += 4) {
            const value = Math.random() < 0.1 ? 255 : 0;
            //data[i] = data[i + 1] = data[i + 2] = value;
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
            data[i + 3] = Math.random() * 50;
        }
        ctx.putImageData(imageData, 0, 0);
        tentacles.forEach(tentacle => {
            tentacle.update(voidfish);
            tentacle.draw(ctx);
        });
        voidfish.forEach(fish => {
            fish.update(voidfish);
            fish.draw(ctx);
        });


        // Random glitch lines
        /*for (let i = 0; i < 10; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.strokeStyle = `rgba(255, 0, 0, ${Math.random() * 0.5})`;
            ctx.lineWidth = Math.random() * 5;
            ctx.stroke();
        }*/

        requestAnimationFrame(drawGlitch);
    }
    drawGlitch();

    function addMessage(content, isUser) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'void-message');
        messageDiv.textContent = content;
        chatArea.prepend(messageDiv);

        messages.push({
            role: isUser ? 'user' : 'assistant',
            content: content
        });

        return messageDiv;
    }

    function createBlurrySpan(text) {
        const span = document.createElement('span');
        span.textContent = text;
        span.style.textShadow = '0 0 10px rgba(255, 0, 0, 1.0)';
        span.style.color = 'transparent';
        return span;
    }

    function deblurText(span) {
        let blur = 10;
        const interval = setInterval(() => {
            blur -= 0.5;
            span.style.textShadow = `0 0 ${blur}px rgba(255, 0, 0, 1.0)`;
            if (blur <= 0) {
                clearInterval(interval);
                span.style.textShadow = 'none';
                span.style.animation = 'text-glow 5s infinite';
                span.style.color = '#f00';
            }
        }, 50);
    }
    async function streamVoidResponse() {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        generatingResponse = true;

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        const messageDiv = addMessage('', false);
        let lastSpan = null;
        playVoidSound();

        while (true) {
            const { done, value } = await reader.read();
            playVoidSound();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0].delta.content;
                        if (content) {
                            const { normalText, zalgoText } = separateZalgoText(content);

                            if (normalText) {
                                const span = createBlurrySpan(normalText);
                                messageDiv.appendChild(span);
                                deblurText(span);
                                lastSpan = span;
                            }

                            if (zalgoText && lastSpan) {
                                lastSpan.textContent += zalgoText;
                            }
                        }
                    } catch (error) {
                        console.error('Error parsing JSON:', error);
                    }
                }
            }
        }
        generatingResponse = false;
    }

    function separateZalgoText(text) {
        let normalText = '';
        let zalgoText = '';

        for (const char of text) {
            if (isZalgoChar(char)) {
                zalgoText += char;
            } else {
                normalText += char;
            }
        }

        return { normalText, zalgoText };
    }

    function isZalgoChar(char) {
        const code = char.charCodeAt(0);
        return (code >= 0x0300 && code <= 0x036F) || // Combining Diacritical Marks
            (code >= 0x1AB0 && code <= 0x1AFF) || // Combining Diacritical Marks Extended
            (code >= 0x1DC0 && code <= 0x1DFF) || // Combining Diacritical Marks Supplement
            (code >= 0x20D0 && code <= 0x20FF) || // Combining Diacritical Marks for Symbols
            (code >= 0xFE20 && code <= 0xFE2F); // Combining Half Marks
    }

    async function handleUserInput() {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            await streamVoidResponse();
        }
    }

    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
    const audioContext = new(window.AudioContext || window.webkitAudioContext)();

    // Creepy void sounds (unchanged)
    function playVoidSound() {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(50 + Math.random() * 100, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 1.5);

        setTimeout(() => {
            oscillator.stop();
        }, 1500);
    }

});