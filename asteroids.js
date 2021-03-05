"use strict";
function asteroids() {
    const svg = document.getElementById("canvas");
    const output = document.getElementById("score");
    const lives = document.getElementById("lives");
    const currentlevel = document.getElementById("currentlevel");
    const currentbomb = document.getElementById("bomb");
    const shipObject = {
        positionX: 300,
        positionY: 300,
        rotation: 0,
        directionX: 0,
        directionY: 0,
        angle: 0,
        radius: 8,
        alive: true,
        lives: [1, 1, 1],
        bomb: [1, 1, 1, 1]
    };
    let startlevel = 0, bullets = [], bulletObservable = Observable.fromArray(bullets), score = [], scoreObservable = Observable.fromArray(score), asteroid = [], asteroidObservable = Observable.fromArray(asteroid), livesObservable = Observable.fromArray(shipObject.lives), isdead = Observable.interval(20)
        .filter(v => dead(v)), numberofasteroids = asteroidObservable.filter(e => isValid(e))
        .scan(0, ((acc, e) => acc + 1))
        .filter(v => (v > calculateAsteroids())), bombObservable = Observable.fromArray(shipObject.bomb);
    function alien() {
        Observable.interval(20000)
            .takeUntil(isdead)
            .subscribe(e => {
            animateAlien();
        });
    }
    function level() {
        Observable.interval(20)
            .subscribe(() => {
            scoreObservable.scan(0, ((acc, e) => acc + e))
                .map(v => Math.floor(v / 100))
                .subscribe(e => {
                if (e == startlevel) {
                    startlevel += 1;
                    shipObject.lives.push(1);
                }
                currentlevel.innerHTML = String(e);
            });
        });
    }
    function display() {
        Observable.interval(20)
            .takeUntil(isdead)
            .subscribe(() => {
            scoreObservable.scan(0, ((acc, e) => acc + e))
                .map(v => v.toString())
                .subscribe(e => output.innerHTML = e);
            livesObservable.scan(0, ((acc, e) => acc + e))
                .subscribe(e => { lives.innerHTML = e.toString(); });
            bombObservable.scan(0, ((acc, e) => acc + e))
                .subscribe(e => currentbomb.innerHTML = (e - 1).toString());
        });
    }
    function updateGameState() {
        Observable.interval(20)
            .takeUntil(isdead)
            .subscribe(() => {
            shipObject.positionX = mod(shipObject.positionX + shipObject.directionX, 600);
            shipObject.positionY = mod(shipObject.positionY - shipObject.directionY, 600);
            shipObject.rotation = shipObject.angle;
            g.attr("transform", "translate(" + String(shipObject.positionX) + " " + String(shipObject.positionY) + ") rotate(" + String(shipObject.rotation) + ")");
            bulletObservable.filter(e => isValid(e))
                .subscribe(e => (e.bulletPositionX = mod(e.bulletPositionX + e.bx, 600),
                e.bulletPositionY = mod(e.bulletPositionY - e.by, 600),
                e.bull.attr("transform", "translate(" + String(e.bulletPositionX) + " " + String(e.bulletPositionY) + ") rotate(" + String(e.bulletAngle) + ")")));
            asteroidObservable.filter(e => isValid(e))
                .subscribe(a => (a.rposX = mod(a.rposX + a.rxdirection, 600),
                a.rposY = mod(a.rposY - a.rydirection, 600),
                a.asteroid.attr("transform", "translate(" + String(a.rposX) + " " + String(a.rposY) + ") rotate(" + String(a.startDirection) + ")"),
                (inrange(shipObject.positionX, a.rposX, shipObject.positionY, a.rposY) < (shipObject.radius + a.radius)) ? respawn() : null,
                bullets.filter(e => isValid(e))
                    .filter(e => (a.valid == true))
                    .forEach(v => (((inrange(v.bulletPositionX, a.rposX, v.bulletPositionY, a.rposY) < a.radius)) && (v.bulletType == 1)) ?
                    ((a.big == false) ?
                        (animateExplosion(a.rposX, a.rposY, a.radius),
                            a.asteroid.elem.remove(),
                            a.valid = false, v.valid = false,
                            score.push(a.score), v.bull.elem.remove())
                        :
                            (animateExplosion(a.rposX, a.rposY, a.radius)
                                , a.asteroid.elem.remove()
                                , a.valid = false, v.valid = false,
                                score.push(a.score), v.bull.elem.remove(),
                                split(a))) : null)));
        });
    }
    const g = new Elem(svg, 'g')
        .attr("transform", "translate(" + String(shipObject.positionX) + " " + String(shipObject.positionY) + ") rotate(" + String(shipObject.rotation) + ")"), ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-15,20 0,12 15,20 0,-20")
        .attr("style", "fill:black;stroke:white;stroke-width:2"), burn = new Elem(svg, 'polyline', g.elem)
        .attr("points", "-5,16 0,25 5,16")
        .attr("style", "fill:none;stroke:none;stroke-width:2"), l1 = new Elem(svg, 'g')
        .attr("transform", "translate(585 20) rotate(0)"), miniship = new Elem(svg, 'polygon', l1.elem)
        .attr("points", "-7,9 0,4 7,9 0,-9")
        .attr("style", "fill:black;stroke:white;stroke-width:2"), bombposition = new Elem(svg, 'g')
        .attr("transform", "translate(585 585) rotate(0)"), bombicon0 = new Elem(svg, 'circle', bombposition.elem)
        .attr("r", "5")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("style", "fill:white;stroke:white;stroke-width:2"), bombicon = new Elem(svg, 'circle', bombposition.elem)
        .attr("r", "10")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("style", "fill:none;stroke:white;stroke-width:1;stroke-dasharray:1");
    function animateAlien() {
        const alienxstart = (random() <= 5) ? [-65, 1] : [665, -1], randomx = alienxstart[0], randomDirection = alienxstart[1], randomy = (random() <= 5) ? 65 : 535, ekeydown = Observable.fromEvent(document, 'keydown')
            .filter(e => e.keyCode === 69), ali = createalien(randomx, randomy);
        Observable.interval(20)
            .takeUntil(Observable.interval(15000))
            .takeUntil(isdead)
            .subscribe(() => (ali.alienposX = ali.alienposX + randomDirection,
            ali.alienposY = -(20 * Math.sin(ali.alienposX / 40) - randomy),
            ali.aship.attr("transform", "translate(" + ali.alienposX + " " + ali.alienposY + ") rotate(0)"),
            ((inrange(shipObject.positionX, ali.alienposX, shipObject.positionY, ali.alienposY) < (shipObject.radius + ali.radius)) && ali.valid == true) ? respawn() : null,
            bullets.filter(e => isValid(e))
                .filter(e => (ali.valid == true))
                .forEach(v => {
                (((inrange(v.bulletPositionX, ali.alienposX, v.bulletPositionY, ali.alienposY) < ali.radius)) && (v.bulletType == 1)) ?
                    (powerup(ali.alienposX, ali.alienposY, 100),
                        animateExplosion(ali.alienposX, ali.alienposY, ali.radius),
                        ali.aship.elem.remove(),
                        ali.valid = false,
                        score.push(ali.score),
                        v.valid = false,
                        v.bull.elem.remove()) : null;
                (((inrange(v.bulletPositionX, shipObject.positionX, v.bulletPositionY, shipObject.positionY) < shipObject.radius)) && (v.bulletType == 2)) ?
                    (respawn(),
                        v.valid = false,
                        v.bull.elem.remove()) : null;
            })));
        Observable.interval(2000)
            .takeUntil(Observable.interval(15000))
            .takeUntil(isdead)
            .subscribe(() => {
            if (ali.valid == true) {
                const b = createBullet(2, 5, ali.alienposX, ali.alienposY, calculateAngle(shipObject.positionX, shipObject.positionY, ali.alienposX, ali.alienposY));
                Observable.interval(1500)
                    .takeUntil(Observable.interval(1600))
                    .subscribe(e => (b.valid = false,
                    b.bull.elem.remove()));
                bullets.push(b);
            }
        });
        ekeydown
            .filter(e => (shipObject.bomb.length > 1))
            .subscribe(() => {
            if (ali.valid == true) {
                (animateExplosion(ali.alienposX, ali.alienposY, ali.radius),
                    powerup(ali.alienposX, ali.alienposY, 100),
                    ali.aship.elem.remove(),
                    ali.valid = false,
                    score.push(ali.score));
            }
        });
    }
    function createalien(x, y) {
        let alien = new Elem(svg, 'g')
            .attr("transform", "translate(" + String(x) + " " + String(y) + ") rotate(0)");
        let alienship = new Elem(svg, 'circle', alien.elem)
            .attr("r", "20")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("style", "fill:none;stroke:white;stroke-width:2");
        let alienship2 = new Elem(svg, 'circle', alien.elem)
            .attr("r", "10")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("style", "fill:black;stroke:white;stroke-width:2");
        return {
            alienposX: x,
            alienposY: y,
            radius: 20,
            aship: alien,
            score: 20,
            valid: true
        };
    }
    function movement() {
        const keydown = Observable.fromEvent(document, 'keydown'), lrUp = Observable
            .fromEvent(document, 'keyup')
            .filter(e => e.keyCode === 68 || e.keyCode === 65), wUp = Observable
            .fromEvent(document, 'keyup')
            .filter(e => e.keyCode === 87 || e.keyCode == 83);
        keydown
            .filter(e => e.keyCode === 87 || e.keyCode === 83)
            .flatMap((v) => Observable.interval(10)
            .takeUntil(wUp)
            .map(e => (v.keyCode === 87) ? { directionX2: (Math.sin(shipObject.rotation * (Math.PI / 180))), directionY2: (Math.cos(shipObject.rotation * (Math.PI / 180))), value: "white" } : { directionX2: 0, directionY2: 0, value: "none" }))
            .subscribe(({ directionX2, directionY2, value }) => {
            shipObject.directionX = directionX2 * 6;
            shipObject.directionY = directionY2 * 6;
            burn.attr("style", "fill:none;stroke:" + String(value) + ";stroke-width:2");
        });
        wUp
            .subscribe(e => Observable.interval(300)
            .takeUntil(Observable.interval(3500))
            .subscribe(e => {
            shipObject.directionX -= shipObject.directionX * 0.2;
            shipObject.directionY -= shipObject.directionY * 0.2;
            burn.attr("style", "fill:none;stroke:none;stroke-width:2");
        }));
        keydown
            .filter(e => e.keyCode === 68 || e.keyCode === 65)
            .map(e => ((e.keyCode === 68) ? { angle: 6 } : { angle: -6 }))
            .flatMap(({ angle }) => (Observable.interval(10)
            .takeUntil(lrUp)
            .map(e => ({ rotate: shipObject.rotation + angle }))))
            .subscribe(({ rotate }) => {
            shipObject.angle = rotate;
        });
    }
    function createBullet(type, speed, x, y, angle) {
        const b = new Elem(svg, 'g')
            .attr("transform", "translate(" + String(x) + " " + String(y) + ") rotate(" + String(angle) + ")"), bullet = new Elem(svg, 'circle', b.elem)
            .attr("r", "3")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("style", "fill:white;stroke:white;stroke-width:1");
        return {
            bulletPositionX: x,
            bulletPositionY: y,
            bulletAngle: angle,
            bx: Math.sin(angle * (Math.PI / 180)) * speed,
            by: Math.cos(angle * (Math.PI / 180)) * speed,
            bull: b,
            bulletType: type,
            valid: true,
        };
    }
    function powerupIcon(icon, chance) {
        if (chance <= 30) {
            const powerupsvg = new Elem(svg, 'polygon', icon.elem)
                .attr("points", "-5,-8 7,-8 7,0 10,0 10,11 0,11 -5,11")
                .attr("style", "fill:black;stroke:white;stroke-width:2"), powerupsvg2 = new Elem(svg, "polygon", icon.elem)
                .attr("points", "-1,-2 3,-2")
                .attr("style", "fill:black;stroke:white;stroke-width:2"), powerupsvg3 = new Elem(svg, "polygon", icon.elem)
                .attr("points", "-1,5 6,5")
                .attr("style", "fill:black;stroke:white;stroke-width:2");
        }
        ;
        if (chance > 33 && chance <= 66) {
            const powerupsvg = new Elem(svg, 'polygon', icon.elem)
                .attr("points", "-5,-8 7,-8 7,2 0,2  0,10 -5,10")
                .attr("style", "fill:black;stroke:white;stroke-width:2"), powerupsvg2 = new Elem(svg, "polygon", icon.elem)
                .attr("points", "-1,-3 3,-3")
                .attr("style", "fill:black;stroke:white;stroke-width:2");
        }
        ;
        if (chance > 66) {
            const shieldpowerupsvg = new Elem(svg, 'polygon', icon.elem)
                .attr("points", "-5,-9 7,-9 7,9 -5,9 ")
                .attr("style", "fill:black;stroke:white;stroke-width:2"), shieldpowerupsvg2 = new Elem(svg, "polygon", icon.elem)
                .attr("points", "1,-3 7,-3")
                .attr("style", "fill:black;stroke:white;stroke-width:2"), shieldpowerupsvg3 = new Elem(svg, "polygon", icon.elem)
                .attr("points", "-5,3 2,3")
                .attr("style", "fill:black;stroke:white;stroke-width:2");
        }
    }
    function powerup(x, y, dropchance = 50) {
        const chance = Math.floor((Math.random() * 100) + 1);
        if (chance <= dropchance) {
            const powerup = new Elem(svg, 'g')
                .attr("transform", "translate(" + String(x) + " " + String(y) + ") rotate(0)"), powerupObject = {
                valid: true,
                svg: powerup,
                radius: 20
            };
            powerupIcon(powerupObject.svg, chance);
            Observable.interval(20)
                .takeUntil(Observable.interval(4000))
                .subscribe(() => {
                if (powerupObject.valid == true) {
                    (inrange(shipObject.positionX, x, shipObject.positionY, y) < (shipObject.radius + powerupObject.radius)) ? (powerupObject.svg.elem.remove(), poweruptype(chance), powerupObject.valid = false) : null;
                }
            });
            Observable.interval(4000)
                .takeUntil(Observable.interval(5000))
                .subscribe(() => (powerupObject.valid = false, powerup.elem.remove()));
        }
    }
    function poweruptype(chance) {
        if (chance <= 33) {
            shipObject.bomb.push(1);
        }
        if (chance > 33 && chance <= 66) {
            Observable.interval(20)
                .takeUntil(Observable.interval(15000))
                .subscribe(() => {
                shoot(-20),
                    shoot(20);
            });
        }
        if (chance > 66) {
            const shield = new Elem(svg, 'circle', g.elem)
                .attr("r", "30")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("style", "fill:none;stroke:white;stroke-width:1;stroke-dasharray:1");
            Observable.interval(20)
                .takeUntil(Observable.interval(9500))
                .subscribe(() => {
                shipObject.alive = false;
            });
            Observable.interval(20)
                .filter(e => (e > 9500))
                .takeUntil(Observable.interval(10000))
                .subscribe(() => {
                shipObject.alive = true;
                shield.attr("style", "fill:none;stroke:none;stroke-width:1;stroke-dasharray:1");
            });
        }
    }
    function createAsteroid(typeChance, x = Math.floor((Math.random() * 600)), y = Math.floor((Math.random() * 600))) {
        const randomDirection = Math.floor((Math.random() * 360)), randomSpeed = Math.floor((Math.random() * 3)) + 1;
        if (typeChance <= 3) {
            let r = new Elem(svg, 'g')
                .attr("transform", "translate(" + String(x) + " " + String(y) + ") rotate(" + String(randomDirection) + ")"), rock = new Elem(svg, 'polygon', r.elem)
                .attr("points", "-8,8 0,11 8,8 11,0 8,-8 0,-11 -8,-8 -11,0")
                .attr("style", "fill:black;stroke:white;stroke-width:1");
            return {
                rposX: x, rposY: y, startDirection: randomDirection,
                rxdirection: Math.sin(randomDirection * (Math.PI / 180)) * randomSpeed,
                rydirection: Math.cos(randomDirection * (Math.PI / 180)) * randomSpeed,
                radius: 9,
                score: 3,
                asteroid: r,
                big: false,
                valid: true
            };
        }
        else {
            let br = new Elem(svg, 'g')
                .attr("transform", "translate(" + String(x) + " " + String(y) + ") rotate(" + String(randomDirection) + ")"), bigrock = new Elem(svg, 'polygon', br.elem)
                .attr("points", "-32,32 0,44 32,32 44,0 32,-32 0,-44 -32,-32 -44,0")
                .attr("style", "fill:black;stroke:white;stroke-width:1");
            return {
                rposX: x, rposY: y, startDirection: randomDirection,
                rxdirection: Math.sin(randomDirection * (Math.PI / 180)) * 1,
                rydirection: Math.cos(randomDirection * (Math.PI / 180)) * 1,
                radius: 45,
                score: 5,
                asteroid: br,
                big: true,
                valid: true
            };
        }
    }
    function bomb() {
        const ekeydown = Observable.fromEvent(document, 'keydown')
            .filter(e => e.keyCode === 69), ekeydup = Observable.fromEvent(document, 'keydown')
            .filter(e => e.keyCode === 69);
        ekeydown
            .filter(e => (shipObject.bomb.length > 1))
            .subscribe(() => asteroidObservable.filter(e => isValid(e))
            .subscribe(e => (animateExplosion(e.rposX, e.rposY, e.radius),
            e.asteroid.elem.remove(),
            e.valid = false,
            score.push(e.score))));
        ekeydown
            .filter(e => (shipObject.bomb.length > 1))
            .subscribe(() => (shipObject.bomb.shift(),
            bombExplosion(shipObject.positionX, shipObject.positionY)));
        ekeydup.filter(e => (shipObject.bomb.length > 0))
            .subscribe(() => initializeAsteroid());
    }
    function shoot(angle = 0) {
        const spacekeydown = Observable.fromEvent(document, 'keydown')
            .filter(e => e.keyCode === 32), tripleshot = Observable.interval(20)
            .filter(e => (angle != 0));
        spacekeydown
            .takeUntil(tripleshot)
            .subscribe(e => {
            const newBullet = createBullet(1, 10, shipObject.positionX, shipObject.positionY, shipObject.angle + angle);
            Observable.interval(600)
                .takeUntil(Observable.interval(610))
                .subscribe(e => (newBullet.valid = false,
                newBullet.bull.elem.remove()));
            bullets.push(newBullet);
        });
    }
    function initializeAsteroid() {
        Observable.interval(20)
            .takeUntil(Observable.interval(100))
            .subscribe(e => {
            const newAsteroid = createAsteroid(random());
            asteroid.push(newAsteroid);
        });
    }
    function repopulateAsteroid() {
        initializeAsteroid();
        Observable.interval(20)
            .flatMap((e) => numberofasteroids)
            .subscribe(n => {
            if (n < (5 + startlevel)) {
                const newAsteroid = createAsteroid(random(), 600, 600);
                asteroid.push(newAsteroid);
            }
        });
    }
    function respawn() {
        ((shipObject.lives).length >= 0 && shipObject.alive == true) ? (animateExplosion(shipObject.positionX, shipObject.positionY, shipObject.radius),
            shipObject.lives.shift(),
            shipObject.positionX = 300,
            shipObject.positionY = 300,
            shipObject.rotation = 0,
            shipObject.alive = false,
            Observable.interval(60)
                .takeUntil(Observable.interval(2000))
                .map(v => 1)
                .scan(0, (acc, e) => acc + e)
                .subscribe(v => (v % 2 === 0) ? ship.attr("style", "fill:black;stroke:none;stroke-width:2") : ship.attr("style", "fill:black;stroke:white;stroke-width:2")),
            Observable.interval(1900)
                .takeUntil(Observable.interval(2000))
                .subscribe(() => shipObject.alive = true)) : null;
    }
    function deathscreen() {
        const end = document.getElementById("game"), end2 = document.getElementById("over");
        Observable.interval(20)
            .filter(e => dead(e))
            .subscribe(() => (end.style.fill = "white",
            end2.style.fill = "white"));
    }
    function mod(x, y) { return (x % y + y) % y; }
    function inrange(x1, x2, y1, y2) { return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2)); }
    function isValid(obj) { return obj.valid == true; }
    function dead(e) { if (shipObject.alive == false && (shipObject.lives).length <= 0) {
        return true;
    }
    else
        return false; }
    function random() { return Math.floor((Math.random() * 10) + 1); }
    function calculateAngle(x1, y1, x2, y2) {
        const dx = (-x1) - (-x2), dy = (-y1) - (-y2);
        return (Math.atan2(dy, dx)) * 180 / Math.PI - 90;
    }
    function calculateAsteroids() {
        const valid = asteroid.filter(e => e.valid == true), number = valid.length - 1;
        return number;
    }
    function split(bigAsteroid) {
        asteroid.push(createAsteroid(1, bigAsteroid.rposX, bigAsteroid.rposY));
        asteroid.push(createAsteroid(1, bigAsteroid.rposX, bigAsteroid.rposY));
        asteroid.push(createAsteroid(1, bigAsteroid.rposX, bigAsteroid.rposY));
    }
    function animateExplosion(x, y, radius) {
        Observable.interval(20)
            .takeUntil(Observable.interval(200))
            .subscribe(() => explosion(x, y, radius));
    }
    function explosion(x, y, radius) {
        const randomx = Math.floor(Math.random() * radius) - radius, randomy = Math.floor(Math.random() * radius) - radius, explo = new Elem(svg, 'g')
            .attr("transform", "translate(" + String(x + randomx) + " " + String(y + randomy) + ") rotate(0)"), smallexplo = new Elem(svg, 'circle', explo.elem)
            .attr("r", 13)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("style", "fill:none;stroke:white;stroke-width:2");
        Observable.interval(200)
            .subscribe(() => explo.elem.remove());
    }
    function bombExplosion(x, y) {
        const boom = new Elem(svg, 'g')
            .attr("transform", "translate(" + String(x) + " " + String(y) + ") rotate(0)"), boomexplosion = new Elem(svg, 'circle', boom.elem)
            .attr("r", 1)
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("style", "fill:none;stroke:white;stroke-width:2;stroke-dasharray:2");
        Observable.interval(10)
            .takeUntil(Observable.interval(1000))
            .map(e => e + 20)
            .subscribe(e => {
            boomexplosion.attr("r", e);
        });
        Observable.interval(10)
            .filter(e => e > 950)
            .takeUntil(Observable.interval(1000))
            .subscribe(e => {
            boom.elem.remove();
        });
    }
    updateGameState();
    display();
    movement();
    shoot();
    alien();
    deathscreen();
    repopulateAsteroid();
    level();
    bomb();
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map