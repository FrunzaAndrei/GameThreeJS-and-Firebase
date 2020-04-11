window.onload = function() {
  readDatabase();
  init();
};

//Variabile
var firebaseConfig;
var numberPlan = 1;
var tableScore = [];
var heightTable = 0;
var raycaster = new THREE.Raycaster();
var raycasterCube1 = new THREE.Raycaster();
var raycasterCube2 = new THREE.Raycaster();
var direction = new THREE.Vector3(0, -1, 0);
var obstacleDirection = new THREE.Vector3(0, 0, -1);
var mouse = new THREE.Vector2();
var planes = new THREE.Object3D();
var grounds = new THREE.Object3D();
var camera;
var cubePlayer;
var contor = 0;
var collision = false;
var score = 0;
var cubeSpeed = 3;
var checkStart = false;
var afisarePrgBar = 0;
//Initializare
init = () => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcce0ff);
  scene.fog = new THREE.Fog(0xcce0ff, 10, 100);
  this.camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  var renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  let canvas = document.getElementById("webGL");
  canvas.appendChild(renderer.domElement);

  window.addEventListener( 'resize', onWindowResize, false );
  function onWindowResize() {
   camera.aspect = window.innerWidth / window.innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize( window.innerWidth, window.innerHeight );
  }


  this.camera.position.z = 90;
  this.camera.position.y = 4;


  let geometryPlayer = new THREE.BoxGeometry(1, 1, 1);
  let materialPlayer = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  this.cubePlayer = new THREE.Mesh(geometryPlayer, materialPlayer);
  this.cubePlayer.position.y = 0.6;
  this.cubePlayer.position.z = 85;
  scene.add(this.cubePlayer);

  let texturePlanStatic = new THREE.TextureLoader().load("images/road.png");
  texturePlanStatic.wrapS = THREE.RepeatWrapping;
  texturePlanStatic.wrapT = THREE.RepeatWrapping;
  texturePlanStatic.repeat.set(1, 12);
  let geometryplaneStatic = new THREE.PlaneGeometry(1, 1, 1);
  let materialplaneStatic = new THREE.MeshBasicMaterial({
    map: texturePlanStatic,
    side: THREE.DoubleSide
  });
  let planeStatic = new THREE.Mesh(geometryplaneStatic, materialplaneStatic);
  planeStatic.rotateX(Math.PI / 2);
  planeStatic.position.set(0, 0, 0);
  planeStatic.scale.set(10, 360, 1);
  scene.add(planeStatic);

  let groundStaticTexture = new THREE.TextureLoader().load("images/iarba.jpg");
  groundStaticTexture.wrapS = groundStaticTexture.wrapT = THREE.RepeatWrapping;
  groundStaticTexture.repeat.set(200, 200);
  groundStaticTexture.anisotropy = 16;
  let groundMaterial = new THREE.MeshBasicMaterial({
    map: groundStaticTexture,
    side: THREE.DoubleSide
  });
  let groundStatic = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1),
    groundMaterial
  );
  groundStatic.position.y = -1.25;
  groundStatic.scale.set(2600, 1800, 1);
  groundStatic.rotateX(Math.PI / 2);
  scene.add(groundStatic);

  let distance;

  terrainGenerator(scene, false); //for plane/street false
  terrainGenerator(scene, true); //for ground/grass true
  moveCubeLeftRight(this.cubePlayer, this.cubePlayer.position.x);

  animate = () => {
    renderer.render(scene, this.camera);
    requestAnimationFrame(animate);
    if (collision == false) {
      terrainMovement();
      checkPlane();
      colisionObject(scene, this.cubePlayer);
    }
  };

  animate();
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////\
let maxPlanes = 5; //grounds
let lastPlane = undefined;
let lastGround = undefined;
terrainGenerator = (scene, isGround) => {
  if (isGround == true) {
    for (let i = 0; i < maxPlanes; i++) {
      let p = makeNewGround(
        new THREE.Vector3(
          0,
          0,
          lastGround ? lastGround.position.z - lastGround.scale.y : 0
        )
      );
      p.userData = { index: i };
      grounds.add(p);
      lastGround = p;
    }
    scene.add(grounds);
  } else {
    for (let i = 0; i < maxPlanes; i++) {
      let p = makeNewPlane(
        new THREE.Vector3(
          0,
          0,
          lastPlane ? lastPlane.position.z - lastPlane.scale.y : 0
        )
      );
      p.userData = { index: i };

      planes.add(p);
      makeObstacle(p);
      lastPlane = p;
    }
    scene.add(planes);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

terrainMovement = () => {
  for (let i = 0; i < planes.children.length; i++) {
    planes.children[i].translateY(0.1 * cubeSpeed);
    grounds.children[i].translateY(0.1 * cubeSpeed);
  }
  if ((score / 100) % 5 == 0) {
    cubeSpeed++;
  }
  showDetail();
};

// Check Start///////////////////////////////////////////////////////////////////////////////////////////

checkStartbtn = () => {
  let html = '<div id="webGL"></div>';
  document.querySelector("body").insertAdjacentHTML("afterBegin", html);
  document.querySelector("#backgroundStart").style.display = "none";
  document.querySelector("#startGame").style.display = "none";
  document.querySelector("#infoTable").style.display = "block";
  init();
};
// /////////////////////////////////////////////////////////////////////////////
showDetail = () => {
  let nivel = cubeSpeed - 2;
  afisarePrgBar = score / (5 * nivel);
   document.querySelector("progress").value = afisarePrgBar;
  document.getElementById("afisareScor").innerText = "Score : " + score;
  document.getElementById("afisareNivel").innerText = "Nivel : " + nivel;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////

distanceVector = (v1, v2) => {
  var dx = v1.x - v2.x;
  var dy = v1.y - v2.y;
  var dz = v1.z - v2.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
makeObstacle = plane => {
  let texture1 = new THREE.TextureLoader().load("images/textCube1.jpg");
  let texture2 = new THREE.TextureLoader().load("images/text2Cube.jpg");
  let geometry = new THREE.BoxGeometry(0.1, 0.005, 1);
  let material = new THREE.MeshBasicMaterial({
    wireframe: false
  });

  let positionX;
  const maxCubes = 15;
  let cubes = {};

  for (let i = 1; i < maxCubes; i++) {
    cubes["cube" + i] = new THREE.Mesh(geometry, material.clone());
    cubes["cube" + i].position.z = -0.5;

    if (i % 2 === 0) {
      positionX = Math.floor(Math.random() * 5);
      cubes["cube" + i].position.y = (i * 0.34) / 10;
      cubes["cube" + i].material.map = texture1;
    } else {
      positionX = -1 * Math.floor(Math.random() * 5);
      cubes["cube" + i].position.y = ((i * 0.34) / 10) * -1;
      cubes["cube" + i].material.map = texture2;
    }
    cubes["cube" + i].position.x = positionX / 10;

    plane.add(cubes["cube" + i]);
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
makeNewPlane = position => {
  let texture = new THREE.TextureLoader().load("images/road.png");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 6);
  let geometryPlaneNew = new THREE.PlaneGeometry(1, 1, 1);
  let materialPlaneNew = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide
  });
  let plan = new THREE.Mesh(geometryPlaneNew, materialPlaneNew);
  plan.rotateX(Math.PI / 2);
  plan.position.set(position.x, position.y, position.z);
  plan.scale.set(10, 180, 1);
  plan.name = "plane" + numberPlan;

  return plan;
};

makeNewGround = position => {
  let groundTexture = new THREE.TextureLoader().load("images/iarba.jpg");
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(200, 200);
  groundTexture.anisotropy = 16;
  let groundMaterial = new THREE.MeshBasicMaterial({
    map: groundTexture,
    side: THREE.DoubleSide
  });
  let mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1), groundMaterial);
  mesh.position.set(position.x, position.y - 1, position.z);
  mesh.scale.set(260, 180, 1);
  mesh.rotateX(Math.PI / 2);

  return mesh;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

checkPlane = () => {
  raycaster.set(
    new THREE.Vector3(
      cubePlayer.position.x,
      cubePlayer.position.y,
      cubePlayer.position.z + 2
    ),
    direction.normalize()
  );

  var intersects = raycaster.intersectObjects(planes.children);

  for (var i = 0; i < intersects.length; i++) {
    let currentIndex = planes.children.indexOf(intersects[i].object);
    let lastDestroyed = planes.children[0];
    let lastGroundDestroy = grounds.children[0];

    if (currentIndex === 1) {
      planes.children.splice(0, 1);
      grounds.children.splice(0, 1);

      lastDestroyed.position.z =
        -intersects[i].object.scale.y * planes.children.length;
      lastGroundDestroy.position.z = -180 * grounds.children.length;

      planes.children.push(lastDestroyed);
      grounds.children.push(lastGroundDestroy);
    }
  }

  score++;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

moveCubeLeftRight = (cube, cubePositionX) => {
  document.addEventListener("keydown", onDocumentKeyDown, false);
  function onDocumentKeyDown(event) {
    var keyCode = event.which;
    if (collision == false) {
      // left
      if ((keyCode == 65 || keyCode == 37) && cube.position.x > -4) {
        cubePositionX--;
        cube.position.x = cubePositionX;

        // right
      } else if ((keyCode == 68 || keyCode == 39) && cube.position.x < 4) {
        cubePositionX++;
        cube.position.x = cubePositionX;
      }
    }
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////

colisionObject = (scene, cubePl) => {
  raycasterCube1.set(
    new THREE.Vector3(
      cubePlayer.position.x - 0.4,
      cubePlayer.position.y,
      cubePlayer.position.z - 0.4
    ),
    obstacleDirection.normalize()
  );
  raycasterCube1.far = 1;
  raycasterCube2.set(
    new THREE.Vector3(
      cubePlayer.position.x + 0.4,
      cubePlayer.position.y,
      cubePlayer.position.z - 0.4
    ),
    obstacleDirection.normalize()
  );
  raycasterCube2.far = 1;

  var intersects1 = raycasterCube1.intersectObject(planes, true);
  var intersects2 = raycasterCube2.intersectObject(planes, true);

  if (intersects1.length && intersects1[0]) {
    collision = true;
    afterColision(scene, cubePl);
  } else if (intersects2.length && intersects2[0]) {
    collision = true;
    afterColision(scene, Pl);
  }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

afterColision = (scene, cubePl) => {
  let groundStaticTexture = new THREE.TextureLoader().load("images/carbuni.jpg");
  groundStaticTexture.wrapS = groundStaticTexture.wrapT = THREE.RepeatWrapping;
  groundStaticTexture.repeat.set(1000, 1000);
  groundStaticTexture.anisotropy = 16;
  let groundMaterial = new THREE.MeshBasicMaterial({
    map: groundStaticTexture,
    side: THREE.DoubleSide
  });
  let groundStatic = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1, 1),
    groundMaterial
  );
  groundStatic.position.y = -0.5;
  groundStatic.scale.set(2600, 1800, 1);
  groundStatic.rotateX(Math.PI / 2);
  scene.add(groundStatic);

  for (let i = 0; i < planes.children.length; i++) {
    for (let j = 0; j < planes.children[i].children.length; j++) {
      planes.children[i].children[j].material.color.set(0xff0000);
    }
    planes.children[i].material.color.set(0xff0000);
  }

  cubePl.material.color.set(0xff0000);

  scene.background = new THREE.Color(0x717c8e);
  scene.fog = new THREE.Fog(0x717c8e, 10, 100);

  document.getElementById("afterGameOver").style.display = "block";
  document.querySelector("#infoTable").style.display = "none";
  document.getElementById(
    "textScor"
  ).innerText = `Scorul tau este : ${score} points`;
};

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

restartGame = () => {
  document.querySelector("#backgroundStart").style.display = "none";
  document.querySelector("#startGame").style.display = "none";
  location.reload(true);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

saveScore = () => {
  document.getElementById("dialogBox").style.display = "block";
};

exitAreaSaveScore = () => {
  document.getElementById("dialogBox").style.display = "none";
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////

saveScoreOnApi = () => {
 let savedData={};
    savedData["name"] = document.getElementById("toStorageValue").value;
    savedData["score"] = score;
    sendToDatabase(savedData.name,savedData.score);
    exitAreaSaveScore();
  }


/////////////////////////////////////////////////////////////////////////////////////////////////////////

showScore = () => {
  tableScore.sort((a,b)=>{
    return b.score - a.score
  });
  // console.log("Afisare din afisare storage:  ",tableScore);
  // console.log(tableScore.length);
  let storageDiv = document.getElementById("storage");
  storageDiv.style.display = "block";
  let tbl = document.createElement("table");
  tbl.id = "storageTable";
  if (tableScore.length > 0) {
    for (var i = 0; i < tableScore.length; i++) {
      if ( i<12 ){
        // console.log("afisare if", tableScore[i].name, tableScore[i].score);
           var row = document.createElement("tr");
          var key = document.createElement("td");
          var val = document.createElement("td");
          key.innerText = (i+1)+' . '+tableScore[i].name + ' -  ' + ' ' ;
          val.innerText = tableScore[i].score;
          row.appendChild(key);
          row.appendChild(val);
          tbl.appendChild(row);
        }
      }
      } else {
    var row = document.createElement("tr");
    var col = document.createElement("td");
    col.innerText = "No data in local storage.";
    row.appendChild(col);
    tbl.appendChild(row);
  };
  if (document.getElementById("storageTable")) {
    // document.getElementById("storageTable").replaceNode(tbl);
  } else {
    storageDiv.appendChild(tbl);
  }
  

};
// /////////////////////////////////////////////////////////////////////////////////////////////////////////////

exitMemory = () => {
  document.getElementById("storage").style.display = "none";
  document.querySelector("#storageTable").remove();
};


///////////////////////////////////////////////////////////////////////////////////////////////////


sendToDatabase = (name,score)=>{
  user ={
    name:name,
    score:score
  }
  firebase.database().ref('Score').push({  name:name,    score:score   },function(error){  if (error) console.log(error);})
  readDatabase();
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

readDatabase = ()=>{
      firebase.database().ref('Score').once('value').then(function(snapshot) {
        tableScore = [];
       snapshot.forEach((childSnapshot)=>{
        tableScore.push(childSnapshot.val());
         
       })
      //  console.log("Afisare din readDatabase ,",tableScore);
     });
    
 }