// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

// Design Comments
// 
// CORE 
// Core components of the game were to be split into several dedicated functions for designated purposes
// updateGameState() which would be responsible for updating the movements of the player ship, asteroids and bullets on canvas in addition to
//                   handling collision detection of ship and asteroids and bullets. Implemented using Observable intervals which updated respective positions 
//                   at each interval
// movement() which used observables to detect keyboard events and mapped them to corresponding changes to the global ship object, which was then updated on canvas by updateGameState()
// shoot() which used observable to detect spacebar keyboard events and upon a keypress creates bullet objects which were then pushed into an array, which is animated on canvas by updateGameState()
// createAsteroid() which uses observables to detect the current number of asteroids on canvas, and creates new asteroids based on a set interval should this number be below a predefined maximum
// respawn() which handles player death, uses observables to render player immune to damage for a short time before becoming vulnerable, and to animate blinking effect
// 
// ADDITIONAL
// Additional components include a random alien ship that attacked the player and powerups that the player could get, including bombs, shield and a triple shot
// 
// 
// 
// AUXILLIARY
// Non animation auxilliary functions created to be as functional, reusable and pure as possible, allowing for multiple reuse when called throughout the program
// Eg mod(), inrange(), isDead(), random(), isValid(), calculateAngle()
// Animation auxilliary functions though not pure were also created to be resued throughout the program, Eg, animateExplosion(), explosion() explosion effect for ship, alien and asteroids
function asteroids() {
  // Inside this function you will use the classes and functions 
  // defined in svgelement.ts and observable.ts
  // to add visuals to the svg element in asteroids.html, animate them, and make them interactive.
  // Study and complete the Observable tasks in the week 4 tutorial worksheet first to get ideas.

  // You will be marked on your functional programming style
  // as well as the functionality that you implement.
  // Document your code!  
  // Explain which ideas you have used ideas from the lectures to 
  // create reusable, generic functions.
  type asteroidObject = {rposX: number, rposY:number, startDirection:number,rxdirection:number,rydirection: number,radius:number,score:number,asteroid:Elem,big:boolean,valid:boolean};
  type bulletOject = {bulletPositionX: number,bulletPositionY: number,bulletAngle: number,bx: number,by: number, bull: Elem,bulletType: number,valid: Boolean};
  type alienObject ={alienposX: number,alienposY: number,radius: number,aship: Elem,score: number,valid: boolean}

  const svg = document.getElementById("canvas")!
  const output = document.getElementById("score")!
  const lives = document.getElementById("lives")!
  const currentlevel = document.getElementById("currentlevel")!
  const currentbomb = document.getElementById("bomb")!

  

  const shipObject = {
    positionX: 300,
    positionY: 300,
    rotation: 0,
    directionX: 0,
    directionY: 0,
    angle: 0,
    radius:8,
    alive: true,
    lives: [1,1,1],
    bomb: [1,1,1,1]
  }
  let startlevel = 0, // cant be constant as we are updating the level to reflect the increasing stages of the game

   bullets: bulletOject[] = [],                               // Array of bullet objects and its observable
   bulletObservable = Observable.fromArray(bullets),

   score: number[] = [],                                      // Array of numbers of total score and its observable
   scoreObservable = Observable.fromArray(score),

   asteroid: asteroidObject[] = [],                             // Array of asteroid objects and its observable
   asteroidObservable = Observable.fromArray(asteroid),

  livesObservable = Observable.fromArray(shipObject.lives),         // Observable used to show current number of lives

  isdead = Observable.interval(20)                                          // Observable used to show if player is dead
                   .filter(v=> dead(v)),

  numberofasteroids = asteroidObservable.filter(e=>isValid(e))                // Observable to show the current number of asteroids on canvas
                                        .scan(0,((acc,e) => acc + 1))
                                        .filter( v=> (v>calculateAsteroids())),

  bombObservable = Observable.fromArray(shipObject.bomb)  // Observable of bomb array, used to show number on canvas
                                        
  function alien(){
    // impure function that repeatedly calls animateAlien() to generate a new alien ship every 20 seconds, 
          Observable.interval(20000)
            .takeUntil(isdead)  // Observable keeps calling until player is dead
            .subscribe(e=> {
              animateAlien()
    })
  }


    function level(){
      // Impure function that implements the game level increments,
      Observable.interval(20)
                .subscribe(()=> {
                  scoreObservable .scan(0,((acc,e) => acc + e))         // score observable that returns the sum of total score in the score array.
                      .map( v=> Math.floor(v/100))                       // divide the stream "score" by a factor to represent level
                      .subscribe(e=> { if (e == startlevel)             // if the current level is equal to current level
                                {startlevel+=1; shipObject.lives.push(1);}  // increment the game current level by one and add a life to player, makes function impure
                                currentlevel.innerHTML = String(e)})    // change html element to represent current level
                    }
                )
    }

    function display(){
      // Function which updates all UI elements for score,lives and current number of bombs on canvas
        Observable.interval(20)
                  .takeUntil(isdead)
                  .subscribe(()=>{
                    scoreObservable .scan(0,((acc,e) => acc + e))
                                    .map( v => v.toString())
                                    .subscribe(e=> output.innerHTML = e);

                    livesObservable .scan(0,((acc,e) => acc + e))
                                    .subscribe(e=>{lives.innerHTML = e.toString()});
      
                    bombObservable .scan(0,((acc,e) => acc + e))
                                    .subscribe(e=> currentbomb.innerHTML = (e-1).toString());
})




    }

    function updateGameState(){
      // Impure function that update most game elements on canvas, including player ship, all bullets and asteroids

      Observable.interval(20)           
                .takeUntil(isdead)
                .subscribe(()=>{
                    // Updates player ship positions 
                    shipObject.positionX = mod(shipObject.positionX + shipObject.directionX,600)
                    shipObject.positionY = mod(shipObject.positionY - shipObject.directionY,600)
                    shipObject.rotation = shipObject.angle
                    g.attr("transform","translate("+String(shipObject.positionX)+" "+String(shipObject.positionY)+") rotate("+String(shipObject.rotation)+")")

                    // Observable from bullet array, updates all bullet positions
                    bulletObservable.filter(e => isValid(e))      
                                    .subscribe( e => (
                                                e.bulletPositionX = mod(e.bulletPositionX + e.bx,600),
                                                e.bulletPositionY = mod(e.bulletPositionY - e.by,600),
                                                e.bull.attr("transform","translate("+String(e.bulletPositionX)+" "+String(e.bulletPositionY)+") rotate("+String(e.bulletAngle)+")")))
                    // Observable from asteroid array, updates all asteroid positions
                    asteroidObservable.filter(e => isValid(e))
                                      .subscribe(a=> (
                                                a.rposX = mod(a.rposX + a.rxdirection,600),
                                                a.rposY = mod(a.rposY - a.rydirection,600),
                                                a.asteroid.attr("transform","translate("+String(a.rposX)+" "+String(a.rposY)+") rotate("+String(a.startDirection)+")"),
                                                (inrange(shipObject.positionX,a.rposX,shipObject.positionY,a.rposY)<(shipObject.radius+a.radius)) ? respawn() : null,  // check for collision with player ship

                                                bullets .filter(e=>isValid(e))                // filters all non valid bullets
                                                        .filter(e => (a.valid == true))    // check to see if asteroid is valid, invalid asteroids are ignored 
                                                        .forEach( v =>(((inrange(v.bulletPositionX,a.rposX,v.bulletPositionY,a.rposY) < a.radius)) && (v.bulletType == 1)) ? // check to see if bullet collides with asteroid, and bullet belongs to player

                                                        ((a.big == false) ?                                      // Check to see if asteroid is big or small
                                                        (animateExplosion(a.rposX,a.rposY,a.radius),
                                                        a.asteroid.elem.remove(),
                                                        a.valid = false, v.valid = false,
                                                        score.push(a.score),v.bull.elem.remove())                                                
                                                        :
                                                        (animateExplosion(a.rposX,a.rposY,a.radius)
                                                        ,a.asteroid.elem.remove()
                                                        ,a.valid = false, v.valid = false,
                                                        score.push(a.score),v.bull.elem.remove(),
                                                        split(a))) : null)))                                    // Big asteroids call split() which splits it into smaller asteroids at the big asteroids position
    })
  }

  // make a group for the spaceship and a transform to move it and rotate it
  // to animate the spaceship you will update the transform property
  const g = new Elem(svg,'g')
                .attr("transform","translate("+String(shipObject.positionX)+" "+String(shipObject.positionY)+") rotate("+String(shipObject.rotation)+")"),

  // create a polygon shape for the space ship as a child of the transform group
      ship = new Elem(svg, 'polygon', g.elem) 
                    .attr("points","-15,20 0,12 15,20 0,-20")
                    .attr("style","fill:black;stroke:white;stroke-width:2"),
  
      burn = new Elem(svg, 'polyline', g.elem) 
                    .attr("points","-5,16 0,25 5,16")
                    .attr("style","fill:none;stroke:none;stroke-width:2"),

      l1 = new Elem(svg,'g')
                    .attr("transform","translate(585 20) rotate(0)"),

      miniship = new Elem(svg, 'polygon', l1.elem) 
                    .attr("points","-7,9 0,4 7,9 0,-9")
                    .attr("style","fill:black;stroke:white;stroke-width:2"),

      bombposition = new Elem(svg,'g')
                    .attr("transform","translate(585 585) rotate(0)"),

      bombicon0 = new Elem(svg,'circle',bombposition.elem)
                    .attr("r", "5")
                    .attr("cx",0)
                    .attr("cy",0)
                    .attr("style", "fill:white;stroke:white;stroke-width:2"),
      bombicon = new Elem(svg,'circle',bombposition.elem)
                    .attr("r", "10")
                    .attr("cx",0)
                    .attr("cy",0)
                    .attr("style", "fill:none;stroke:white;stroke-width:1;stroke-dasharray:1")

  function animateAlien() {
    // Impure function that animates movement and shooting of alien ship 

    const alienxstart = (random()<=5) ? [-65,1] : [665,-1], // alien ship can start at 1 of 4 corners of the canvas, alienxstart determines whether alien spawns on left and moves right or spawns right and moves left
              randomx = alienxstart[0],
      randomDirection = alienxstart[1],       
              randomy = (random()<=5)? 65:535,              // randomy determines whether alien ship spawsn on upper or lower part of canvas


    ekeydown = Observable.fromEvent<KeyboardEvent>(document,'keydown')  // keydown observable that detects "e" button press
                    .filter(e => e.keyCode === 69),

    ali = createalien(randomx,randomy)           

    Observable.interval(20)                                       // Observable that animates the alien ship, lasts for 15 seconds, or until player is dead
          .takeUntil(Observable.interval(15000))  
          .takeUntil(isdead)
          .subscribe(()=>(
          ali.alienposX = ali.alienposX + randomDirection,                                    // updates position of alien ship on canvas
          ali.alienposY = -(20*Math.sin(ali.alienposX/40)-randomy),
          ali.aship.attr("transform","translate("+ali.alienposX+" "+ali.alienposY+") rotate(0)"),
          ((inrange(shipObject.positionX,ali.alienposX,shipObject.positionY,ali.alienposY)<(shipObject.radius+ali.radius)) && ali.valid == true) ? respawn() : null,  // collision detection between player ship and alien, if detects a hit, calls respawn() to indicate a death
        
            bullets.filter(e=>isValid(e))                                 // collision detection for bullets on alien ship, first filters out non valid bullets
                   .filter(e => (ali.valid == true))                           // filters out non valid alien ships, prevents multiple scoring if the alien ship is dead
                   .forEach( v =>{
                  (((inrange(v.bulletPositionX,ali.alienposX,v.bulletPositionY,ali.alienposY) < ali.radius)) && (v.bulletType ==1)) ?   // check to see if bullet is in range of alien ship and that bullet belongs to ship (type1), prevents aliens own bullet from hitting itself
                  (powerup(ali.alienposX,ali.alienposY,100),                                                                            // generates powerup at position of alien death
                  animateExplosion(ali.alienposX,ali.alienposY,ali.radius),                                                             // creates explosion animation
                  ali.aship.elem.remove(),                                                                                              // remove alien ship svg from canvas
                  ali.valid = false,                                                                                                    // make alien invalid, prevents multiple scoring on one alien ship
                  score.push(ali.score),                                                                                                // add score to score array
                  v.valid = false,                                                                                                      // make bullet invalid, prevents bullet from hitting any more objects
                  v.bull.elem.remove()) : null;                                                                                         // remove bullet svg

                  (((inrange(v.bulletPositionX,shipObject.positionX,v.bulletPositionY,shipObject.positionY) < shipObject.radius)) && (v.bulletType ==2)) ?    // collision detection for alien bullet on player ship, ie (bullettype 2)
                  (respawn(),                                                                                                            // call repspawn() to trigger alien death
                  v.valid = false,                                                                                                       // cahnge bullet to invalid
                  v.bull.elem.remove()):null})                                                                                           // remove bullet svg
          ))
                                                                // Observer to animate alien shooting at player, uses teh same createBullet() function and bullet array as played, but bullet objects have variable of type 2 indicating diffent bullet
    Observable.interval(2000)                                   // Alien shoots every 2 seconds
            .takeUntil(Observable.interval(15000))              // alien shoots up to 15 seconds
            .takeUntil(isdead)                            
            .subscribe(()=>{
              if (ali.valid == true){                           // Only shoots when alien is valid  
              const b = createBullet(2,5,ali.alienposX,ali.alienposY,calculateAngle(shipObject.positionX,shipObject.positionY,ali.alienposX,ali.alienposY,)) // create bullets of type 2 at alien position, calling calculateAngle() to determine shooting direction towards player
              Observable.interval(1500)                         // travel time for alien bullents before they stop
                .takeUntil(Observable.interval(1600))
                .subscribe( e=> (
                  b.valid = false,                              // make bullets invalid after 1.5 seconds
                  b.bull.elem.remove()))                        // remove bullet svg
              bullets.push(b)                                     // add bullet to bullet array for animation
  }})

    ekeydown                                                    // Observable to detect when player used bomb ability
            .filter(e=> (shipObject.bomb.length>1))                 // Only triggers when player has a bomb and "e" button is pressed
            .subscribe(()=> {if(ali.valid == true){(animateExplosion(ali.alienposX,ali.alienposY,ali.radius), // if valid alien ship (not dead), call animate explosion to animate alien death at alien position
                                                    powerup(ali.alienposX,ali.alienposY,100),                 // make alien drop powerup at aliens position
                                                    ali.aship.elem.remove(),                                  // remove alien ship svg
                                                    ali.valid = false,                                        // make alien invalid
                                                    score.push(ali.score))}})                                 // add score


  }

  function createalien(x:number,y:number):alienObject{
    // Function that creates an alien object when called at provided x and y position
    let alien =  new Elem(svg,'g')
        .attr("transform","translate("+String(x)+" "+String(y)+") rotate(0)") 
    let alienship = new Elem(svg, 'circle', alien.elem) 
        .attr("r", "20")
        .attr("cx",0)
        .attr("cy",0)
        .attr("style", "fill:none;stroke:white;stroke-width:2")
    let alienship2 = new Elem (svg, 'circle', alien.elem) 
        .attr("r", "10")
        .attr("cx",0)
        .attr("cy",0)
        .attr("style", "fill:black;stroke:white;stroke-width:2")

    return {
      alienposX: x,
      alienposY: y,
      radius:20,
      aship: alien,
      score: 20,
      valid: true
    }}

  function movement(){
    // Impure function that handles the ship movement, impure as it modifies the ship objects direction and angle variables

    const 
    keydown = Observable.fromEvent<KeyboardEvent>(document,'keydown'), 
    lrUp = Observable                                                     // Observable that detects only "a" and "d" keys, for left and right movement
              .fromEvent<KeyboardEvent>(document,'keyup')
              .filter(e => e.keyCode === 68 || e.keyCode === 65),
    wUp = Observable                                                       // Observable that detects only "w" keyup
              .fromEvent<KeyboardEvent>(document,'keyup')
              .filter(e => e.keyCode === 87 || e.keyCode == 83);

    keydown                                                           // Observable for forward thrust and brake
      .filter(e => e.keyCode === 87 || e.keyCode === 83)              // Only takes keydowns of "w" and "s"
      .flatMap((v) =>
        Observable.interval(10)                                       // Observable that allows movement to keep triggering until "w" keyup is detected
        .takeUntil(wUp)                             
        .map(e=> (v.keyCode === 87) ?{directionX2:(Math.sin(shipObject.rotation*(Math.PI / 180))), directionY2: (Math.cos(shipObject.rotation*(Math.PI /180))), value: "white"} : {directionX2: 0, directionY2: 0, value: "none"} )) // Maps "w" to forward movement, "s" to break
      .subscribe(({directionX2,directionY2,value})=>{
          shipObject.directionX = directionX2*6                                           // update ships current x direction
          shipObject.directionY = directionY2*6                                           // update ships current y direction
          burn.attr("style","fill:none;stroke:"+String(value)+";stroke-width:2")})        // makes thruster burn effect visible when "w" keydown is pressed
      
    wUp                                                                 // Observable to implment thrust slow down
      .subscribe(e => 
      Observable.interval(300)
        .takeUntil(Observable.interval(3500))                         
        .subscribe(e=> {
          shipObject.directionX -= shipObject.directionX*0.2                    // slows ship's x direction down by a factor
          shipObject.directionY -= shipObject.directionY*0.2                    // slows ship's y direction down by a factor
          burn.attr("style","fill:none;stroke:none;stroke-width:2")}))     // turns thruster burn efect off

    keydown                                                             // Observable to implement left and right movement
      .filter(e => e.keyCode === 68 || e.keyCode === 65)
      .map(e=>( (e.keyCode === 68) ? {angle: 6}: {angle: -6}))
      .flatMap(({angle}) => (
           Observable.interval(10)                                      // enable ship to keep turning until the "a" or "d" keyup is detected
            .takeUntil(lrUp)
            .map( e => ({rotate: shipObject.rotation + angle}))))
      .subscribe(({rotate})=>{
        shipObject.angle = rotate})                                          // update ships current angle
  }

  function createBullet(type:number,speed:number,x:number,y:number,angle:number):bulletOject{
    // fuction that creates and returns bullet objects according to type, speed x,y position and angle when called
   const b = new Elem(svg,'g')
            .attr("transform","translate("+String(x)+" "+String(y)+") rotate("+String(angle)+")"),
         bullet =  new Elem(svg, 'circle', b.elem)
            .attr("r", "3")
            .attr("cx",0)
            .attr("cy",0)
            .attr("style", "fill:white;stroke:white;stroke-width:1")

    return { 
      bulletPositionX: x,
      bulletPositionY: y,
      bulletAngle: angle,
      bx: Math.sin(angle*(Math.PI / 180))*speed,
      by: Math.cos(angle*(Math.PI / 180))*speed, 
      bull: b,
      bulletType: type,
      valid: true,
    }
  }

  function powerupIcon(icon:Elem,chance:number){
    // Impure function that attaches different svg elements based on what ships powerup is.
    if (chance <= 30){
      const powerupsvg = new Elem(svg, 'polygon', icon.elem) 
                          .attr("points","-5,-8 7,-8 7,0 10,0 10,11 0,11 -5,11")
                          .attr("style","fill:black;stroke:white;stroke-width:2"),
            powerupsvg2 = new Elem(svg,"polygon",icon.elem)
                          .attr("points","-1,-2 3,-2")
                          .attr("style","fill:black;stroke:white;stroke-width:2"),
            powerupsvg3 = new Elem(svg,"polygon",icon.elem)
                          .attr("points","-1,5 6,5")
                          .attr("style","fill:black;stroke:white;stroke-width:2")
    };
    if (chance > 33 && chance <=66){
      const powerupsvg = new Elem(svg, 'polygon', icon.elem) 
                .attr("points","-5,-8 7,-8 7,2 0,2  0,10 -5,10")
                .attr("style","fill:black;stroke:white;stroke-width:2"),
            powerupsvg2 = new Elem(svg,"polygon",icon.elem)
                .attr("points","-1,-3 3,-3")
                .attr("style","fill:black;stroke:white;stroke-width:2")
    };
 
    if (chance > 66){
      const  shieldpowerupsvg = new Elem(svg, 'polygon', icon.elem) 
                    .attr("points","-5,-9 7,-9 7,9 -5,9 ")
                    .attr("style","fill:black;stroke:white;stroke-width:2"),
            shieldpowerupsvg2 = new Elem(svg,"polygon",icon.elem)
                    .attr("points","1,-3 7,-3")
                    .attr("style","fill:black;stroke:white;stroke-width:2"),
            shieldpowerupsvg3 = new Elem(svg,"polygon",icon.elem)
                    .attr("points","-5,3 2,3")
                    .attr("style","fill:black;stroke:white;stroke-width:2")}
  }

  function powerup(x:number,y:number,dropchance:number = 50){
    // impure function that generates powerup objects at provided position, based on a provided chance

    const chance = Math.floor((Math.random()*100)+1)     // generates random number between 1-100 to compare against the drop chance
                                    

    if (chance<=dropchance){

    const powerup = new Elem(svg,'g')
                  .attr("transform","translate("+String(x)+" "+String(y)+") rotate(0)"),
    
          powerupObject = {
            valid: true,        // required to prevent multiple powerups from triggering
            svg: powerup,
            radius: 20         // detection radius of powerup
          };
      
      powerupIcon(powerupObject.svg,chance)

      Observable.interval(20)
                .takeUntil(Observable.interval(4000))
                .subscribe(()=>
                    {if (powerupObject.valid == true) // checks to see if valid powerup
                      {(inrange(shipObject.positionX,x,shipObject.positionY,y) < (shipObject.radius+powerupObject.radius)) ? (powerupObject.svg.elem.remove(),poweruptype(chance),powerupObject.valid = false) : null}}) // if valid, check to see if in range of ship, if we are, call poweruptype() to trigger power up then remove power up svg and make invalid
      
      Observable.interval(4000)                       
                .takeUntil(Observable.interval(5000))
                .subscribe(()=>
                    (powerupObject.valid = false, powerup.elem.remove())                   // removes svg after 5 seconds if not picked up, makes object invalid, makes function impure
                )

    }
  }


  function poweruptype(chance:number){
    // Impure function that dictates what kind of powerup obtained when activated
    
    if (chance <= 33) { 
      shipObject.bomb.push(1)   // add to bomb array 33% chance to obtain bomb, makes function impure
    }

    if (chance > 33 && chance <=66){                  // 33% chance to obtain triple shot
        
      Observable.interval(20)             
                  .takeUntil(Observable.interval(15000))    // ability runs for only 15 seconds
                  .subscribe(()=>{
                    shoot(-20),                             // Calls shoot function with altered degree as parameter
                    shoot(20)                               // Calls shoot function with altered degree as parameter
                  })}
  
    if (chance > 66){                                       // 33 % chance to obtain shield
      const shield = new Elem(svg, 'circle', g.elem)        // create svg shield at ship position
                      .attr("r", "30")
                      .attr("cx",0)
                      .attr("cy",0)
                      .attr("style", "fill:none;stroke:white;stroke-width:1;stroke-dasharray:1")

      Observable.interval(20)                               // Observable that chances ship alive variable to false, makes ship "invulnerable"
                .takeUntil(Observable.interval(9500))       // ability runs for around 10 seconds
                .subscribe(()=>{
                  shipObject.alive = false                        // makes function impure
                })
      Observable.interval(20)                           
                .filter(e=>(e>9500))                        // filter stream until 9.5 seconds passed. ie subscribe gets stream after 9.5 seconds
                .takeUntil(Observable.interval(10000))
                .subscribe(()=>{
                  shipObject.alive = true                       // chance ship back to alive. "vulnerable"
                  shield.attr("style", "fill:none;stroke:none;stroke-width:1;stroke-dasharray:1")   // Remove shield svg     
                })}}


  function createAsteroid(typeChance:number,x = Math.floor((Math.random()*600)),y = Math.floor((Math.random()*600))):asteroidObject{

    // Impure function that creates asteroid objects with a random type at a position x and y. if no position given, asteroids are randomly generated with a random x and y between 0-600

    const
          randomDirection = Math.floor((Math.random()*360)),    // Gives asteroid random direction to move
          randomSpeed = Math.floor((Math.random()*3)) + 1       // Gives asteroid a random move speed

        // creates small asteroids if type chance is <= 3, ie 30%
        if (typeChance <= 3){

        let r = new Elem(svg,'g')
                  .attr("transform","translate("+String(x)+" "+String(y)+") rotate("+String(randomDirection)+")"),
         rock = new Elem(svg, 'polygon', r.elem)                                  // Different svg sizes to represent different asteroid
                  .attr("points","-8,8 0,11 8,8 11,0 8,-8 0,-11 -8,-8 -11,0")
                  .attr("style","fill:black;stroke:white;stroke-width:1")

        return {
          rposX: x, rposY: y, startDirection: randomDirection,
          rxdirection: Math.sin(randomDirection*(Math.PI / 180))*randomSpeed,
          rydirection: Math.cos(randomDirection*(Math.PI / 180))*randomSpeed,
          radius: 9,
          score: 3,
          asteroid: r,
          big: false,     //Differentiates beteen big and small asteroids
          valid: true
        }}
        // creates big asteroids if type chance is > 3, ie 70%
        else {
        let
         br = new Elem(svg,'g')
                  .attr("transform","translate("+String(x)+" "+String(y)+") rotate("+String(randomDirection)+")"),
         bigrock = new Elem(svg, 'polygon', br.elem) 
                  .attr("points","-32,32 0,44 32,32 44,0 32,-32 0,-44 -32,-32 -44,0")         // Different svg sizes to represent different asteroid
                  .attr("style","fill:black;stroke:white;stroke-width:1")

        return {
          rposX: x, rposY: y, startDirection: randomDirection,
          rxdirection: Math.sin(randomDirection*(Math.PI / 180))*1,       
          rydirection: Math.cos(randomDirection*(Math.PI / 180))*1,
          radius: 45,
          score: 5,
          asteroid: br,
          big: true,      //Differentiates beteen big and small asteroids
          valid: true
        }}}


  function bomb(){
    // Impure function that handles the ships bomb ability
    const 
    ekeydown = Observable.fromEvent<KeyboardEvent>(document,'keydown')  // Observable that detects only keydowns of "e"
                  .filter(e => e.keyCode === 69),
    ekeydup = Observable.fromEvent<KeyboardEvent>(document,'keydown')   // Observable that detects only keyups of "e"
              .filter(e => e.keyCode === 69)

    ekeydown
          .filter(e=> (shipObject.bomb.length>1))                           // Checks to see if we have any bombs to use, if we do enable bomb to work
          .subscribe(()=>
            asteroidObservable.filter(e => isValid(e))                  // Observer that goes through all asteroids in our asteroid array, and filters them, only return those that are valid.
                  .subscribe(e=> (animateExplosion(e.rposX,e.rposY,e.radius),      // if valid asteroid, animate explosion effect at asteroid current position, and with asteroids radius
                                  e.asteroid.elem.remove(),                        // remove asteroid svg element, makes function umpure
                                  e.valid = false,                                 // make asteroid invalid, makes function umpure
                                  score.push(e.score))))                           // add asteroid score to our score array, makes function umpure

    ekeydown
          .filter(e=> (shipObject.bomb.length>1))                                      // Checks to see if we have any bombs to use, if we do enable bomb to work
            .subscribe(()=>(shipObject.bomb.shift(),                                   // Deduct 1 bomb from array, makes function impure
                          bombExplosion(shipObject.positionX,shipObject.positionY)))       // animate bomb explosion effect at current position, makes function umpure

    ekeydup.filter(e=> (shipObject.bomb.length>0))                                     // repopuates canvas with asteroids after bomb. due to current implementation, repopulateAsteroids() does not work when asteorids array consists of 
            .subscribe(()=> initializeAsteroid())                                  // invalid asteroids. Ie when bomb ability is triggered. Thus, we add more asteroids after every bomb trigger. Makes function impure
  }
  


  function shoot(angle:number = 0){
    // Impure function that handles the ships shooting ability, angle parameter is implemented to incorporate triple shot ability of ship

    const 
    spacekeydown = Observable.fromEvent<KeyboardEvent>(document,'keydown')
                  .filter(e => e.keyCode === 32),         // filter all key downs other than spacebar
           
    tripleshot = Observable.interval(20)                  // Observable that returns a stream only when angle is not 0
                          .filter(e=>(angle!=0))

    spacekeydown
      .takeUntil(tripleshot)                              // Incorporated as part of triple shot ability. enables ability to shoot once before being stopped. 
      .subscribe( e => {
          const newBullet = createBullet(1,10,shipObject.positionX,shipObject.positionY,shipObject.angle + angle) // Creates new bullet of type 1,(ship bullet) originating from our ships current position and facing ships current angle by default, can be changed to alter angle
          Observable.interval(600)                        // Observable that triggers after 600ms, implemented to stop bullets after a certain time frame.
            .takeUntil(Observable.interval(610)) 
            .subscribe( e=> (
              newBullet.valid = false,                    // makes bullet invalid so that it does not interact with any other objects on canvas, makes function impure
              newBullet.bull.elem.remove()                // removes bullet svg elem from canvas, makes function impure
            ))
          bullets.push(newBullet)})                       // add new bullet to bullet array for animation, makes function impure
  }


  function initializeAsteroid(){
    // Impure function that initializes the canvas with predetemined number of asteroids, created seperate to make enable instant repopulation of asteroids on canvas. repopulateAsteroids() does not if there are 
    // no more asteroids on canvas as asteroid array is empty, such as after a ship bomb ability trigger. Funtion allows more asteroids to be created after bomb trigger, which enable repopulateAsteroids() to work again

    // Observbale that creates asteroids, calls createastoid function that generate random astorids and pushes asteroid objects into asteroid array to be animated
    Observable.interval(20)
        .takeUntil(Observable.interval(100))
        .subscribe( e =>{
        const newAsteroid = createAsteroid(random())   // random generates a number between 1 to 10, based on number makes either big or small asteroids
        asteroid.push(newAsteroid)})                   // Function is impure as we are updating the asteroid array with new asteroid objects
  }

  function repopulateAsteroid(){
    // Impure function that is called when game is initialized. First calls initalizeAsteroids() to populate canvas, and constanly adds more asteroids when the total number of asteroids is below a certain number, which increases 
    //  as the game level increases
    initializeAsteroid()
      
    Observable.interval(20)
            .flatMap((e) =>                                             // flatmap our intervals against the the numberofasteroids observable
              numberofasteroids)                                        // returns a stream of the current number of asteroids on canvas. 
            .subscribe( n  => {   
              if (n<(5+startlevel)){                                     // conditional that checks our stream against our asteroid limit, if below our asteroid limit we create a new asteroid
                const newAsteroid = createAsteroid(random(),600,600)    // creates a random astoid as the position 600 600 of canvas
                asteroid.push(newAsteroid)}})                           // Function is impure as we are updating the asteroid array with new asteroid objects
  }

  function respawn(){ 
    // Impure function that handles player respawn
    // Conditional that checks to see if player has lives remaining and ship state is alive. State check to pevent multiple lives lost at one interval when colliding with asteroids or alien bullets
    ((shipObject.lives).length >= 0 && shipObject.alive == true) ? (
        animateExplosion(shipObject.positionX,shipObject.positionY,shipObject.radius),  // Create death explosion effect
        shipObject.lives.shift(),                                               // Decrease lives by one, makes function impure
        shipObject.positionX = 300,                                             // respwns player back in center of map
        shipObject.positionY = 300,
        shipObject.rotation = 0,
        shipObject.alive = false,                                               // Change state of player ship to dead. makes function impure, pevent multiple lives lost at one interval
        
        // Observable that creates the blinking invulnerable effect upon player death
        Observable.interval(60)
          .takeUntil(Observable.interval(2000))
          .map(v => 1)                                                       // Map interval stream to values of 1
          .scan(0,(acc,e)=> acc + e)                                         // Scan to enable a stream of inceasing integers
          .subscribe( v=>(v%2===0) ? ship.attr("style","fill:black;stroke:none;stroke-width:2") : ship.attr("style","fill:black;stroke:white;stroke-width:2")), // we alternate the stroke colour of ship based on even or odd number from stream to simulate blinking

        // Observable that makes player vunerable again after a certain amount of time
        Observable.interval(1900)
            .takeUntil(Observable.interval(2000))
            .subscribe(()=>
            shipObject.alive = true)
    ) : null}

  function deathscreen(){
    // Function that makes gameover text on canvas visible once player dies and is out of lives, function is impure as it modifies the state of the canvas
    const end = document.getElementById("game")!,
          end2 = document.getElementById("over")!
    // Observable which is filtered by dead function, only returns the stream once the player is dead, when dead we make "game over" text on canvas visible
    Observable.interval(20)
              .filter(e=> dead(e))
              .subscribe(()=>
                (end.style.fill = "white",
                end2.style.fill = "white")
              )
    }
  
  function mod (x:number,y:number):number {return (x%y+y)%y} // Pure function that calculates the modulus y of a number x. Used to allow ship, bullets, asteroids and alien to wrap around the canvas

  function inrange (x1:number,x2:number,y1:number,y2:number):number {return Math.sqrt(Math.pow((x2-x1),2)+Math.pow((y2-y1),2))} // Pure function that determines the distance between 2 points on canvas, used for collision detection for the game
  
  function isValid (obj: asteroidObject|bulletOject) {return obj.valid == true} // Pure function that checks a inpur objects "valid" variable to see if it is set to true  

  function dead (e:number):boolean {if (shipObject.alive == false && (shipObject.lives).length <= 0) {return true}else return false} // Function returns e if player is dead, and nothing if player is alive, used to filter observables streams until the player is dead

  function random():number{return Math.floor((Math.random()*10)+1)}


  function calculateAngle(x1:number,y1:number,x2:number,y2:number):number{
    // Pure function that calculate the angle from the alien ship to our ship, function exclusively used by the animate alien function to allow alien to always targer out ship
    // no matter where we are on canvas

    const dx = (-x1)-(-x2),
          dy = (-y1)-(-y2)
    return (Math.atan2(dy,dx))*180/Math.PI - 90
  }

  function calculateAsteroids():number{
    // pure function that calculates the current number of asteroids on the canvas, and returns that number. Done by filtering the asteroid array with all asteroids which are tagged as invalid. and 
    // returning that as an array. We then calculate the length of that array to give us the current number of valid asteroids on canvas

    const valid = asteroid.filter(e=>e.valid ==true),
        number = valid.length -1
        return number 
  }
  
  function split (bigAsteroid:asteroidObject){
    // calls createAsteroid function to generate new asteroids of type 1, ie small asteroids, at the previous position of the big asteroid where it was destroyed.
    // pushed into the asteroid array so that it becomes animated by the update function

    asteroid.push(createAsteroid(1,bigAsteroid.rposX,bigAsteroid.rposY))
    asteroid.push(createAsteroid(1,bigAsteroid.rposX,bigAsteroid.rposY))
    asteroid.push(createAsteroid(1,bigAsteroid.rposX,bigAsteroid.rposY))
  }

  function animateExplosion(x:number,y:number,radius:number){
    // Animates the explosion effect by calling the explosion function multiple times, split into 2 functions to have smaller funcitions and as for explosion to generate new random x and y positions it has to be called again. becomes
    // messy to incorpoprate both aspects into one function

    // Observer calls explosion function multiple times
    Observable.interval(20)
      .takeUntil(Observable.interval(200))
      .subscribe(()=>explosion(x,y,radius))
  }

  function explosion(x:number,y:number,radius:number){
      // Creates a random explosion circle anywhere within the given radius of a given x and y coordinate, done to simulate different explosion animation sizes for different elements, ie ship, big rock, small rock
      // included observable removes svg after a set time

      // Generates x and y position
    const randomx = Math.floor(Math.random()*radius) - radius,
          randomy = Math.floor(Math.random()*radius) - radius,
     
          explo =  new Elem(svg,'g')
            .attr("transform","translate("+String(x+randomx)+" "+String(y+randomy)+") rotate(0)"),
          smallexplo = new Elem(svg, 'circle', explo.elem) 
            .attr("r", 13)
            .attr("cx",0)
            .attr("cy",0)
            .attr("style", "fill:none;stroke:white;stroke-width:2")
    
      // Observable to remove the svg element from canvas after a certain time
          Observable.interval(200)
              .subscribe(()=>
                explo.elem.remove()
              )
  }


  function bombExplosion(x:number,y:number){
    // Create and animate the ships bomb explosion ability at a input x and y coordinate on the canvas, x and y enable explosion to always originate from the ship as the center
    const boom =  new Elem(svg,'g')
            .attr("transform","translate("+String(x)+" "+String(y)+") rotate(0)") ,
          boomexplosion = new Elem(svg, 'circle', boom.elem) 
            .attr("r", 1)
            .attr("cx",0)
            .attr("cy",0)
            .attr("style", "fill:none;stroke:white;stroke-width:2;stroke-dasharray:2")
    // Observable for animation, increases the radius of the circle svg with each interval plus a constant
    // Function is not pure as it modifies an svg on the canvas
    Observable.interval(10)
      .takeUntil(Observable.interval(1000))
      .map(e=>e+20)
      .subscribe(e=>{
        boomexplosion.attr("r",e)
      })
    // Observable for removing the svg circle after a certain time, uses a filter to block all observables below a certain millisecond time so that subscribe only triggers the elem removal after a certain time
    Observable.interval(10)
      .filter(e=> e>950)
      .takeUntil(Observable.interval(1000))
      .subscribe(e=>{
        boom.elem.remove()
      })
  }
  
  updateGameState()
  display()
  movement()
  shoot()
  alien()
  deathscreen()
  repopulateAsteroid()
  level()
  bomb()
}

// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
    
  }