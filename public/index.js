window.addEventListener("DOMContentLoaded", init);
import { GLTFLoader } from "./three/examples/jsm/loaders/GLTFLoader.js";
const scene = new THREE.Scene();  //シーンを作成
const camera = new THREE.PerspectiveCamera(90, 800 / 800, 1, 100000);  //カメラを作成
const renderer = new THREE.WebGLRenderer({ canvas: document.querySelector("#myCanvas") }); //レンダラーを作成
const controls = new THREE.PointerLockControls(camera, renderer.domElement);
let moveIsActive = true;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
var slide;
var slideData = getSlideData();
var img;
var objectGroup = [];
var slides = [];
var userModels = [];
var chatCount = 0;
const loader = new GLTFLoader();
const url = "./NEWOPEN.glb";

var user = {
  id: document.getElementById('userId').value,
  name: document.getElementById('name').value,
  rotationY: 0,
  x: Math.floor(Math.random() * 1500) % 1500,
  z: Math.floor(Math.random() * 1500) % 1500 + 5000,
  beforeX: 0,
  beforeZ: 0,
  beforeRotationY: 0
}


function init() {
  firebase.database().ref('users/' + user.id).set(user);

  // 初期化のために実行
  onResize();
  // リサイズイベント発生時に実行
  window.addEventListener('resize', onResize);

  renderer.setClearColor(0x3f88ef);
  renderer.shadowMap.enabled = true;
  camera.position.set(user.x, 200, user.z);

  let meshFloor = new THREE.Mesh(
    new THREE.BoxGeometry(40000, 0.1, 40000),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
  );
  scene.add(meshFloor);

  let board = new THREE.Mesh(
    new THREE.BoxGeometry(10000, 100, 5000),
    new THREE.MeshStandardMaterial({ color: 0xfafafa })
  )
  board.rotation.x = (Math.PI / 180) * 90
  board.position.set(0, 2500, -3000);
  scene.add(board)


  let boardWrap = new THREE.Mesh(
    new THREE.BoxGeometry(10500, 100, 5700),
    new THREE.MeshStandardMaterial({ color: 0x6699FF })
  )
  boardWrap.rotation.x = (Math.PI / 180) * 90
  boardWrap.position.set(0, 2500, -3100);
  scene.add(boardWrap)

  let face_img = new THREE.TextureLoader().load('img_face.jpg',
    (tex) => { // 読み込み完了時
      // 縦横比を保って適当にリサイズ
      const w = 5;
      const h = tex.image.height / (tex.image.width / w);
      // 平面
      const geometry = new THREE.PlaneGeometry(500, 500);
      const material = new THREE.MeshPhongMaterial({ map: face_img });
      img = new THREE.Mesh(geometry, material);
      img.scale.set(w, h, 1);
      img.position.set(2500, 1600, -2920)
      scene.add(img);
      img.visible = false;
    });

  let beenos_img = new THREE.TextureLoader().load('beenos.png',
    (tex) => { // 読み込み完了時
      // 縦横比を保って適当にリサイズ
      const w = 5;
      const h = tex.image.height / (tex.image.width / w);
      // 平面
      const geometry = new THREE.PlaneGeometry(500, 500);
      const material = new THREE.MeshPhongMaterial({ map: beenos_img });
      const plane = new THREE.Mesh(geometry, material);
      plane.scale.set(w, h, 1);
      plane.rotation.x = (Math.PI / 180) * 1
      plane.position.set(800, 4300, -2930)
      scene.add(plane);
    });

  let links_img = new THREE.TextureLoader().load('links.png',
    (tex) => { // 読み込み完了時
      // 縦横比を保って適当にリサイズ
      const w = 5;
      const h = tex.image.height / (tex.image.width / w);

      // 平面
      const geometry = new THREE.PlaneGeometry(300, 300);
      const material = new THREE.MeshPhongMaterial({ map: links_img });
      const plane = new THREE.Mesh(geometry, material);
      plane.scale.set(w, h, 1);
      plane.rotation.x = (Math.PI / 180) * 1
      plane.position.set(3100, 4300, -2930)
      scene.add(plane);
    });

  for (let index = 0; index < slideData.length; index++) {
    slide = createSlide(slideData[index])
    scene.add(slide)
    slide.visible = false
    slides.push(slide);
  }

  let stage = new THREE.Mesh(
    new THREE.BoxGeometry(3000, 300, 1500),
    new THREE.MeshStandardMaterial({ color: 0xe9e9e9 })
  )
  stage.position.set(0, 0, -2000);
  scene.add(stage)

  let light2 = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(light2);

  let light = new THREE.PointLight(0xfafafa, 2, 15000, 1);
  light.position.set(3000, 8000, 3000);

  light.castShadow = true;
  light.shadow.mapSize.width = 2024;
  light.shadow.mapSize.height = 2024;
  scene.add(light);

  var grid = new THREE.GridHelper(40000, 100, 0x808080, 0x808080);
  grid.position.set(0, 0, 0);
  scene.add(grid);

  renderer.render(scene, camera);

  slideNumberReceive()
  initKeyEvent();
  initChatBar();
  setRandomObjects();
  renderer.domElement.addEventListener('click', function () {
    controls.lock();
  });
  syncUser();
  tick();
  usersPositionSet();

  function tick() {
    requestAnimationFrame(tick);
    move();
    syncUser();
    renderer.render(scene, camera);
  }
}

function move() {
  let time = performance.now();
  if (controls.isLocked === true && moveIsActive === true) { //マウスのポインタがロックされているときのみ有効
    let delta = (time - prevTime) / 250;

    //速度を減衰させる
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    if (velocity.x < 0.1) {
      velocity.x = 0
    }
    if (velocity.z < 0.1) {
      velocity.z = 0
    }

    //進行方向のベクトルを設定
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 4000.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 4000.0 * delta;

    user.z = Math.floor(camera.position.z);
    user.x = Math.floor(camera.position.x);
    camera.rotation.order = 'YXZ';
    let radius = camera.rotation.y > 0
      ? camera.rotation.y
      : (2 * Math.PI) + camera.rotation.y;
    user.rotationY = radius + 180 * (Math.PI / 180);
    controls.moveRight(- velocity.x * delta);
    controls.moveForward(- velocity.z * delta);

  }
  prevTime = time;
}

function syncUser() {
  if (user.x !== user.beforeX || user.z !== user.beforeZ || user.beforeRotationY !== user.rotationY) {
    firebase.database().ref('users/' + user.id).set({
      user
    });
    user.beforeX = Math.floor(user.x);
    user.beforeZ = Math.floor(user.z);
    user.beforeRotationY = user.rotationY;
  }
}

function addUser(addUser) {
  moveIsActive = false;
  loader.load(
    url,
    function (gltf) {
      //すべてのメッシュ(物体)にcastShadow(影を発生させる設定)を適用する
      gltf.scene.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true;
        }
      });
      let model = gltf.scene;
      model.scale.set(25.0, 25.0, 25.0);
      model.position.set(addUser.x, 100, addUser.z);
      model.rotation.set(0, 0, 0);
      scene.add(model);

      let name = new THREE.Mesh(
        new THREE.PlaneGeometry(25 * addUser.name.length, 25),
        new THREE.MeshStandardMaterial({
          map: createTexture({
            text: addUser.name,
            fontSize: 25
          })
        })
      )

      name.position.set(addUser.x, 300, addUser.z + 70)
      scene.add(name);

      let message = document.createElement('LI');
      message.innerText = addUser.name + " さんが参加しました";
      document.getElementById('message_list').appendChild(message);

      userModels.push({ id: addUser.id, model: model, name: name })

    },
    function (error) {
    }
  );
  moveIsActive = true;

}

function createImageObject(imgName, width, height, x, y, z) {
  let imgObject;
  let img = new THREE.TextureLoader().load('beenos.png',
    (tex) => { // 読み込み完了時
      // 縦横比を保って適当にリサイズ
      const w = 5;
      const h = tex.image.height / (tex.image.width / w);
      // 平面
      const geometry = new THREE.PlaneGeometry(500, 500);
      const material = new THREE.MeshPhongMaterial({ map: img });
      imgObject = new THREE.Mesh(geometry, material);
      imgObject.scale.set(w, h, 1);
      imgObject.rotation.x = (Math.PI / 180) * 1
      imgObject.position.set(800, 4300, -2930)
    });
  return imgObject;
}

function usersPositionSet() {
  firebase.database().ref('users').on('value', (usersCollection) => {
    Object.entries(usersCollection.val()).forEach(userItem => {

      let userIndex = userModels.findIndex(({ id }) => id.toString() == userItem[0].toString());
      if (userIndex === -1 && userItem[0].toString() != user.id.toString()) {
        if (userItem[1].user) {
          addUser(userItem[1].user)
        }

      } else {
        let modelData = userModels[userIndex];
        if (modelData) {
          modelData.model.position.set(userItem[1].user.x, 100, userItem[1].user.z);
          modelData.model.rotation.set(0, userItem[1].user.rotationY, 0)
          modelData.name.position.set(userItem[1].user.x, 300, userItem[1].user.z + 70)
          modelData.name.rotation.set(0, userItem[1].user.rotationY, 0)
        }
      }
    });
  });
  firebase.database().ref('users').on('child_removed', (removeUser) => {
    let userIndex = userModels.findIndex(({ id }) => id.toString() == removeUser.val().user.id.toString());
    let modelData = userModels[userIndex];
    moveIsActive = false;
    scene.remove(modelData.model);
    scene.remove(modelData.name);
    moveIsActive = true;

    let message = document.createElement('LI');
    message.innerText = removeUser.val().user.name + " さんが退出しました";
    document.getElementById('message_list').appendChild(message);
  });
}

function initKeyEvent() {
  let onKeyDown = function (event) {  //キーボード押下時の処理
    switch (event.keyCode) {
      case 87: // w
        moveForward = true;
        break;
      case 65: // a
        moveLeft = true;
        break;
      case 83: // s
        moveBackward = true;
        break;
      case 68: // d
        moveRight = true;
        break;

    }
  };

  let onKeyUp = function (event) {  //キーボードから離れたとき
    switch (event.keyCode) {
      case 87: // w
        moveForward = false;
        break;
      case 65: // a
        moveLeft = false;
        break;
      case 83: // s
        moveBackward = false;
        break;
      case 68: // d
        moveRight = false;
        break;
    }
  };

  window.addEventListener('keydown', onKeyDown, false);  //キーボードに関するイベントリスナ登録
  window.addEventListener('keyup', onKeyUp, false);
}

function initChatBar() {

  let chatKey = function (event) {
    if (event.keyCode === 116 || event.type === 'click') {
      document.getElementById('chat_bar').style.display = 'block';
      document.getElementById('chat_bar').focus();
      controls.unlock();
      event.preventDefault();
    }
  }
  let submitChat = function (event) {
    if (event.keyCode === 13) {
      let inputMessage = document.getElementById('chat_bar').value;
      if (inputMessage.slice(0, 1) === '@' || inputMessage.slice(0, 1) === '＠') {
        inputMessage = inputMessage.slice(1)
        let box = new THREE.Mesh(
          new THREE.BoxGeometry(100, 100, 100),
          new THREE.MeshStandardMaterial({
            map: createTexture({
              text: inputMessage,
              fontSize: 100
            })
          })
        );
        box.position.set(user.x, 100, user.z)
        scene.add(box)
        let id = Math.random().toString(32).substring(2)
        firebase.firestore().collection('message_box').doc(id).set({
          id: id,
          x: user.x,
          z: user.z,
          message: inputMessage
        })
        objectGroup.push({
          id: id,
          object: box
        });
        document.getElementById('chat_bar').value = "";

      } else {
        firebase.firestore()
          .collection('chat')
          .doc(user.id + chatCount.toString())
          .set({
            name: user.name,
            message: inputMessage
          });
        chatCount++;
        document.getElementById('chat_bar').value = "";
      }
    }
  }

  window.addEventListener('keypress', chatKey, false);
  document.getElementById('chat_bar').addEventListener('keypress', submitChat, false);
  document.getElementById('chat_box').addEventListener('click', chatKey)
  firebase.firestore()
    .collection('chat')
    .onSnapshot(chatCollection => {
      chatCollection.docChanges().forEach(change => {
        if (change.type === 'added') {
          let message = document.createElement('LI');
          message.innerText = change.doc.data().name + "：" + change.doc.data().message;
          document.getElementById('message_list').appendChild(message);
        }
      });
    });
  firebase.firestore()
    .collection('message_box')
    .onSnapshot(chatCollection => {
      chatCollection.docChanges().forEach(change => {
        let object = change.doc.data();
        let objectIndex = userModels.findIndex(({ id }) => id.toString() == object.id.toString());
        if (objectIndex === -1) {
          moveIsActive = false
          let box = new THREE.Mesh(
            new THREE.BoxGeometry(100, 100, 100),
            new THREE.MeshStandardMaterial({
              map: createTexture({
                text: object.message,
                fontSize: 100
              })
            })
          );
          box.position.set(object.x, 100, object.z)
          scene.add(box)
          objectGroup.push({
            id: object.id,
            object: box
          });
        }
        moveIsActive = true
      });
    });
}

function addImageObject(imgName, width, height, x, y, z) {

}

function setRandomObjects() {
  for (let index = 0; index < 100; index++) {
    let color = { r: 0, g: 0, b: 0 };	// RGB 0～255の値で設定
    for (let i in color) {
      color[i] = Math.floor(Math.random() * 256);
    }
    let myColor = "rgb(" + color.r + ", " + color.g + ", " + color.b + ")";
    let object = new THREE.Mesh(
      new THREE.SphereGeometry(Math.floor(Math.random() * 1500) + 200, 50, 50),
      new THREE.MeshStandardMaterial({ color: myColor, roughness: 0.5 })
    )
    let positionX = Math.floor(Math.random() * 15000);
    let positionY = Math.floor(Math.random() * 5000);
    let positionZ = Math.floor(Math.random() * 15000);
    positionX = Math.floor(Math.random() * 2 + 1) == 1 ? positionX * (-1) : positionX;
    positionZ = Math.floor(Math.random() * 2 + 1) == 1 ? positionZ * (-1) : positionZ;
    object.position.set(positionX, 6000 + positionY, positionZ);
    scene.add(object)
  }
}

function slideNumberReceive() {

  firebase.firestore()
    .collection('presentation')
    .doc('now_presentation')
    .onSnapshot(doc_snapshot => {
      for (let index = 0; index < slides.length; index++) {
        slides[index].visible = false;

      }
      slides[doc_snapshot.data().now_id].visible = true;
      switch (doc_snapshot.data().now_id) {
        case 1:
          img.visible = true;

          break;
        default:
          img.visible = false;
          break
      }

    }, err => {
      console.log(`Encountered error: ${err}`);
    });

}

function createSlide(strings) {
  var slide_temp = new THREE.Group();
  for (let index = 0; index < strings.length; index++) {
    let text_length = strings[index].length;
    let text_width = 250 * text_length;
    let text = new THREE.Mesh(
      new THREE.PlaneGeometry(text_width, 250),
      new THREE.MeshStandardMaterial({
        map: createTexture({
          text: strings[index],
          fontSize: 250
        })
      })
    )
    text.position.set(-((9000 - text_width) / 2), 4000 - 250 * index, -2900);

    slide_temp.add(text);
  }

  return slide_temp
}

function createTexture(options) {
  // Canvas要素を作成
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // measureTextするためいったん設定
  const fontFamily = 'monospace';
  ctx.font = `bold ${options.fontSize}px '${fontFamily}'`;
  const textWidth = ctx.measureText(options.text);

  // dprに対応したサイズを計算
  const width = textWidth.width;
  const height = options.fontSize;

  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';
  // 幅を指定
  canvas.width = width;
  canvas.height = height;

  // 中央にテキストを描画
  ctx.font = `bold ${options.fontSize}px '${fontFamily}'`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'hanging';
  ctx.fillStyle = 'rgba(255, 255, 255, 1.0)';

  ctx.fillText(options.text, 0, options.fontSize * 0.2);
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(0, 0, 0, 1.0)';
  ctx.fillText(options.text, 0, options.fontSize * 0.2);

  // テクスチャを作成
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = false;
  // ↓ここら辺の設定をしておかないとthree.jsでエラーが出る時がある
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.format = THREE.RGBAFormat;

  return texture;
}

function onResize() {
  // サイズを取得
  const width = window.innerWidth;
  const height = window.innerHeight;

  // レンダラーのサイズを調整する
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);

  // カメラのアスペクト比を正す
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
