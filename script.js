var config = {
  apiKey: "AIzaSyCzI8agk4guBHbAtDqefi884qhMLvbboxw",
  authDomain: "color-clasification.firebaseapp.com",
  databaseURL: "https://color-clasification.firebaseio.com",
  projectId: "color-clasification",
  storageBucket: "",
  messagingSenderId: "948445494330"
};

firebase.initializeApp(config);
let database = firebase.database();


let r, g, b;

let labelLegend = [
  'red-ish',
  'green-ish',
  'blue-ish',
  'orange-ish',
  'yellow-ish',
  'pink-ish',
  'purple-ish',
  'brown-ish',
  'grey-ish'
]

let model;

const colorDiv = () => {
  r = Math.floor(Math.random() * 256);
  g = Math.floor(Math.random() * 256);
  b = Math.floor(Math.random() * 256);

  document.getElementById("output").style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
}



const chooseColor = (colorLabel) => {
  let data = {
    r: r,
    g: g,
    b: b,
    label: colorLabel
  }

  sendColor(data)
  colorDiv();

}

const sendColor = (data) => {
  let colorDatabase = database.ref('colors');
  let color = colorDatabase.push(data, finished);
  console.log("firebase generated key: " + color.key);
  console.log(data);

  function finished(err) {
    if (err)
      console.error("oei: " + err)
    else {
      console.log("data saved");

    }
  }
}




let ref = database.ref('colors');

const retreiveData = () => {
  // ref.once('value', gotData);

  fetch('http://127.0.0.1:5500/data.json')
    .then(function (response) {
      return response.text();
    })
    .then(function (text) {
      // console.log(JSON.parse(text).entries);
      gotData(JSON.parse(text).entries);
    })
    .catch(function (error) {
      console.error('Request failed', error)
    });
}

function gotData(res) {
  let data = res;
  let keys = Object.keys(data);
  let jsonData = new Array();
  let output = "";
  for (const key of keys) {
    const obj = data[key];
    output +=
      `<button style='background-color: rgb(${obj.r},${obj.g},${obj.b})'>${obj.label}</button>`

    jsonData.push({
      r: obj.r,
      g: obj.g,
      b: obj.b,
      label: obj.label
    })

  }
  document.getElementById('output_done').innerHTML = output;



  doSomethingWithData(jsonData);
}

const doSomethingWithData = (jsonData) => {
  let untaggedColors = new Array();
  let labels = [];
  for (const item of jsonData) {
    untaggedColors.push([item.r / 255, item.g / 255, item.b / 255]);
    labels.push(labelLegend.indexOf(item.label)); //look for elem and get index for it
  }


  console.log(untaggedColors);
  console.log(labels);
  //converting x values (what is given) into tensors
  let lsX = tf.tensor2d(untaggedColors); //rgb

  let tensorLabels = tf.tensor1d(labels, 'int32'); //labels
  let lsY = tf.oneHot(tensorLabels, 9);

  tensorLabels.dispose();


  //creating the model
  model = tf.sequential();

  //adding layers to model
  model.add(tf.layers.dense({
    units: 16, activation: 'sigmoid', inputDim: 3
  }))

  model.add(tf.layers.dense({
    units: 9, activation: 'softmax'
  })); //9 labels, geen inutDim want krijgt ze van vorige

  let learningRate = 0.2;
  let optimizer = tf.train.sgd(learningRate);

  model.compile({
    optimizer: optimizer,
    loss: 'categoricalCrossentropy' //voor classification
  })

  train(lsX, lsY).then(async (res) => {
    const saveResult = await model.save('localstorage://my-model-1');
    console.log("data saved");
    console.log(saveResult);
  })
}

const train = async (lsX, lsY) => {
  let options = {
    epochs: 200,
    validationSplit: 0.05,
    shuffle: true,
    callbacks: {
      onTrainBegin: () => {/* */ },
      onBatchEnd: tf.nextFrame,
      onEpochEnd: (numOfEpochs, logs) => {
        document.getElementById('animationDisp').innerHTML = `#${numOfEpochs} Loss:  ${logs.loss}`;
      }
    }
  }

  return await model.fit(lsX, lsY, options);
}


const predict = () => {
  let rVal = document.getElementById('r').value;
  let gVal = document.getElementById('g').value;
  let bVal = document.getElementById('b').value;

  document.getElementById('rvalue').innerHTML = rVal;
  document.getElementById('gvalue').innerHTML = gVal;
  document.getElementById('bvalue').innerHTML = bVal;
  document.getElementById("preview").style.backgroundColor = 'rgb(' + rVal + ',' + gVal + ',' + bVal + ')';

  let xVal = tf.tensor2d([[rVal / 255, gVal / 255, bVal / 255]]);
  let prediction = model.predict(xVal);

  let index = prediction.argMax(1).dataSync(); //dataSync because tensor to int
  let color = labelLegend[index]
  console.log(color);
  document.getElementById('prediction').innerHTML = `Color: ${color}`;
}








const retreiveModel = async () => {
  model = await tf.loadModel('localstorage://my-model-1');
}

