interface Point {
    x: number;
    y: number;
}

interface MultiPoints extends Array<Point>{}

let line:MultiPoints = [
    {x: 0.25, y: 0.5},
    {x: 0.75, y: 0.5}
];

let appState:AppState;

let currentPointIndex = 0;

const server = "http://localhost:5000";

class AppState {
    identifiers: string[];
    currentIndex: number = 0;
    done: boolean = false;
    constructor(data) {
        this.identifiers = data.map(function(obj){return obj["identifier"];});
        console.log("Identifiers: " + this.identifiers);
        this.updateCorners();
    }
    currentImageURL(): URL {
        let cur_img_url = new URL(server
                                  + "/items/"
                                  + this.identifiers[this.currentIndex]
                                  + "/raw");
        console.log("Current image url: " + cur_img_url);
        return cur_img_url;
    }
    updateCorners() {
      let getURL = server
                    + "/overlays"
                    + '/line_points/'
                    + this.identifiers[this.currentIndex];
      $.ajax({
          type: 'GET',
          url: getURL,
          success: function(data) {
            console.log(data.length);
            if (data.length !== 2) {
                line = [
                    {x: 0.25, y: 0.5},
                    {x: 0.75, y: 0.5}
                ];
            } else {
                line = data;
            }
            console.log(JSON.stringify(line));
            drawLine(line);
          },
      });
    }
    updateProgressBar() {
        let human_index = this.currentIndex + 1;
        let progress_str = "Progress: " + human_index + "/" + this.identifiers.length;
        console.log(progress_str);
        document.querySelector("#progressBar").innerHTML = progress_str;
    }
    persistInOverlay(line: MultiPoints) {
      let putURL = server
                    + "/overlays"
                    + '/line_points/'
                    + this.identifiers[this.currentIndex];
      console.log('persistInOverlay', JSON.stringify(line), putURL);
      $.ajax({
          type: 'PUT',
          url: putURL,
          data: JSON.stringify(line),
          success: function(data) {
              console.log("Success!");
              appState.currentIndex += 1;
              appState.updateProgressBar();
              if (appState.currentIndex < appState.identifiers.length) {
                  let imageURL = appState.currentImageURL();
                  console.log(imageURL);
                  drawImageFromURL(imageURL);
                  appState.updateCorners();
              } else {
                  // Done.
                  appState.done = true;
                  document.querySelector("#progressBar").innerHTML = "Done!  &#128512;";
                  document.querySelector("#workArea").innerHTML = "";
                  document.querySelector("#help").innerHTML = "Do some post processing...";
              }
          },
          contentType: "application/json"
      });
    }
    next() {
        this.persistInOverlay(line);
    }
    prev() {
        if (this.currentIndex > 0) {
            console.log("previous");
            this.currentIndex -= 1;
            drawImageFromURL(this.currentImageURL());
            this.updateProgressBar();
            this.updateCorners();
        }
    }
}

let drawImageFromURL = function(imageURL: URL) {
    let c = <HTMLCanvasElement>document.getElementById("imgCanvas");
    let ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    let img = new Image();
    img.src = String(imageURL);
    img.addEventListener('load', function() {
        ctx.drawImage(img, 0, 0, 800, 600);
    });
}

let initialiseAppState = function() {
    $.get(server + "/items", function(data) {
        appState = new AppState(data["_embedded"]["items"]);
        let imageURL = appState.currentImageURL();
        drawImageFromURL(imageURL);
        appState.updateProgressBar();
    });
}

let getElementRelativeCoords = function(item, event): Point {
    let elemRect = item.getBoundingClientRect();
    let absX = event.clientX - elemRect.left;
    let absY = event.clientY - elemRect.top;
    return {"x": absX, "y": absY};
}

let getElementNormCoords = function(item, event): Point {
    let elemRect = item.getBoundingClientRect();
    let absPos = getElementRelativeCoords(item, event);
    let height = elemRect.height;
    let width = elemRect.width;
    let normX = absPos.x / width;
    let normY = absPos.y / height;

    return {"x": normX, "y": normY};
}

let magnitude = function(p: Point): number {
    return Math.sqrt(p.x * p.x + p.y * p.y);
}

let distance = function(p1: Point, p2: Point): number {
    let diff:Point = {"x": p1.x - p2.x, "y": p1.y - p2.y};
    return magnitude(diff);
}

let drawCircle = function(p: Point) {
    let c = <HTMLCanvasElement>document.getElementById("pointsCanvas");
    let ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(p.x * c.width, p.y * c.height, 5, 0, 2*Math.PI);
    ctx.strokeStyle = "red";
    ctx.stroke();
}

let drawLine = function(line: MultiPoints) {
    let p0:Point = line[0];
    let p1:Point = line[1];

    let c = <HTMLCanvasElement>document.getElementById("pointsCanvas");
    let ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.beginPath();
    ctx.moveTo(p0.x * c.width, p0.y * c.height)
    ctx.lineTo(p1.x * c.width, p1.y * c.height)
    ctx.closePath();
    ctx.strokeStyle = "red";
    ctx.stroke();

    drawCircle(p0)
    drawCircle(p1)

}

let movePoint = function(p: Point, line: MultiPoints): MultiPoints {
        console.log("Called movePoint", p);
        line[currentPointIndex] = p;
        if (currentPointIndex == 0) {
            currentPointIndex = 1;
        } else {
            currentPointIndex = 0;
        }
        drawLine(line);
        return line;
}

let setupCanvas = function() {
    let item = document.querySelector("#imgCanvas");
    $("#pointsCanvas").click(function(event) {
        let normCoords:Point = getElementNormCoords(item, event);
        console.log("Clicked: " + JSON.stringify(normCoords));
        line = movePoint(normCoords, line);
    });
};

let setupKeyBindings = function() {
    document.addEventListener('keydown', function(event) {
        // Right arrow.
        if (event.keyCode == 39 &&  !appState.done) {
            appState.next();
        }
        // Left arrow.
        if (event.keyCode == 37 &&  !appState.done) {
            appState.prev();
        }
    });
}

let createOverlay = function() {
  let putURL = server
               + "/overlays"
               + '/line_points';
  console.log('overlay url: ' + putURL);
  $.ajax({
      type: 'PUT',
      url: putURL,
      success: function(data) {
          console.log("overlay created");
      },
      error: function(data) {
          console.log("overlay exists");
      }
  });
}


let main = function() {
    console.log("Running main function");
    createOverlay();
    initialiseAppState();
    setupCanvas();
    drawLine(line);
    setupKeyBindings();
}

window.onload = main;
