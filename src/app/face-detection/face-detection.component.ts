import { Component, ViewChild, ElementRef, HostListener} from '@angular/core';
import { NgOpenCVService, OpenCVLoadResult } from 'ng-open-cv';
import { tap, switchMap, filter } from 'rxjs/operators';
import { forkJoin, Observable, BehaviorSubject } from 'rxjs';
import { FileUploader } from 'ng2-file-upload/ng2-file-upload';


const URL:string = 'http://localhost:3000/api/upload';

@Component({
  selector: 'app-face-detection',
  templateUrl: './face-detection.component.html',
  styleUrls: ['./face-detection.component.css'],
})
//@HostListener('mousemove', ['$event']) 
@ViewChild('canvasOutput')
export class FaceDetectionComponent {
  private className:string = "";
  private classes = [{name:"empty", color:this.getRandomColor()},{name:"part empty", color:"aqua"}];
  private warning:string = "";
  private canvas:any; 
  private expression:Boolean = false;
  // private output:HTMLElement;
  //rectangle parametrs
  private ctx:any;
  private canvasx:number;
  private canvasy:number;
  private last_mousex:number;
  private last_mousey:number;
  private mousex:number;
  private mousey:number;
  private mousedown:Boolean;
  private selectedFiles: FileList;
  private fileName: string;
  private rectParams:any;
  rects = [];
  //uploader utils
  private API:string = "http://localhost:3000/photo-1547647296998..MOV";
  public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'photo'});
  // Notifies of the ready state of the classifiers load operation
  private classifiersLoaded = new BehaviorSubject<boolean>(false);
  classifiersLoaded$ = this.classifiersLoaded.asObservable();
  
  // HTML Element references
  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('canvasInput')
  canvasInput: ElementRef;
  @ViewChild('canvasOutput')
  canvasOutput: ElementRef;
  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    console.log(event);
    if (event.key === "Delete") {
      this.rects.splice(this.rects.length - 1, this.rects.length)
    }
  }

  // Inject the NgOpenCVService
  constructor(private ngOpenCVService: NgOpenCVService) {

  }

  ngOnInit() {
    this.classes[0].color = this.getRandomColor();
    this.classes[1].color = this.getRandomColor();
    this.loadCV();
    this.sendFiles();
    // Always subscribe to the NgOpenCVService isReady$ observer before using a CV related function to ensure that the OpenCV has been
    // successfully loaded
    this.ngOpenCVService.isReady$
      .pipe(
        // The OpenCV library has been successfully loaded if result.ready === true
        filter((result: OpenCVLoadResult) => result.ready),
        switchMap(() => {
          // Load the face and eye classifiers files
          return this.loadClassifiers();
        })
      )
      .subscribe(() => {
        // The classifiers have been succesfully loaded
        this.classifiersLoaded.next(true);
      });
  }

  ngAfterViewInit() {
    this.canvas = document.getElementById('canvasOutput');
    this.ctx = this.canvas.getContext("2d");
    this.canvasx = this.canvas.offsetLeft;
    this.canvasy = this.canvas.offsetTop;
    this.last_mousex = 0;
    this.last_mousey = 0;
    this.mousex = 0;
    this.mousey= 0;
    this.mousedown = false;
  }

  sendFiles():void {
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
         alert('File uploaded successfully');
         let jsonRes:any;
         try {
            jsonRes = JSON.parse(response);
         }
         
         catch(err) {
            console.error('Error:', err);
         }
         this.API = "http://localhost:3000";
         this.setApi(this.API + "/" + jsonRes.filename);
     };
  }

  detectFiles(event:any):void {
      this.selectedFiles = event.target.files;
      this.fileName = this.selectedFiles[0].name;
      this.uploader.uploadAll();
      this.expression = true;
  }

  setApi(API:string):void {
    this.API = API;
  }

  mouseDown(event:any):void{
    this.last_mousex = event.clientX - this.canvasx;
    this.last_mousey = event.clientY - this.canvasy;
    this.mousedown = true;
  }

  mouseUp():void {
    let width = this.mousex - this.last_mousex;
    let height = this.mousey - this.last_mousey;
    this.rects.push({x:this.last_mousex, y:this.last_mousey, width:width, height:height, color:this.rectParams.color, name:this.rectParams.name});
    this.mousedown = false;
    this.drawRectangles();
  }


  drawRectangles():void {
    //  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for(var i = 0; i < this.rects.length; i++) {
      var rect = this.rects[i];
      this.ctx.beginPath();
      this.ctx.rect(rect.x, rect.y, rect.width, rect.height);
      this.ctx.strokeStyle = rect.color;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.fillStyle = rect.color;
      this.ctx.font = "10px Arial";
      this.ctx.fillText(rect.name, rect.x + 2, rect.y + 10);
      this.ctx.closePath();
    }
  }

  onMouseMove(event:any):void {
    this.mousex = event.clientX - this.canvasx;
    this.mousey = event.clientY - this.canvasy;
    if(this.mousedown) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); //clear canvas
      this.drawRectangles();
      this.ctx.beginPath();
      let width = this.mousex - this.last_mousex;
      let height = this.mousey - this.last_mousey;
      // console.log('-*****', this.last_mousex, this.last_mousey)

      this.ctx.rect(this.last_mousex, this.last_mousey, width, height);
      // this.rects.push({x:this.last_mousex, y:this.last_mousey, width:width, height:height});
      this.ctx.strokeStyle = this.rectParams.color;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
      this.ctx.fillStyle = this.rectParams.color;
      this.ctx.font = "10px Arial";
      this.ctx.fillText(this.rectParams.name, this.last_mousex + 2, this.last_mousey + 10);
    }
  }

  setClasses(event:any):void {
    this.rectParams = {name:event.name, color:event.color};
  }

  getRandomColor():any {
    const letters = '0123456789ABCDEF'.split('');
    let color = '#';
    for (let i = 0; i < 6; i++){
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  addClass():void {
    let isContains:Boolean = false;
    this.classes.forEach(clazz => {
      if(this.className === clazz.name || this.className.length == 0) {
        //alert("this class name already use please input other name");
        this.warning = "this class name already use please input other name";
        isContains = true;
        return;
      }
    });
    if(isContains === true) return;
    this.classes.push(
      {name: this.className, color:this.getRandomColor()}
    );
    this.className = "";  
    this.warning = "";
  }

  popClass(clazz:any):void {
    if(this.classes.indexOf(clazz) === 0) this.classes.shift();
    this.classes.splice(this.classes.indexOf(clazz), this.classes.indexOf(clazz));
  }

  onSearchChange(searchValue:string):void {  
    this.className = searchValue;
  }

  onKeydown(event):void {
    if (event.key === "Enter") {
      this.addClass();
    }
  }
  
  // Before attempting face detection, we need to load the appropriate classifiers in memory first
  // by using the createFileFromUrl(path, url) function, which takes two parameters
  // @path: The path you will later use in the detectMultiScale function call
  // @url: The url where to retrieve the file from.
  loadClassifiers(): Observable<any> {
    return forkJoin(
      this.ngOpenCVService.createFileFromUrl(
        'haarcascade_frontalface_default.xml',
        `assets/opencv/data/haarcascades/haarcascade_frontalface_default.xml`
      ),
      this.ngOpenCVService.createFileFromUrl(
        'haarcascade_eye.xml',
        `assets/opencv/data/haarcascades/haarcascade_eye.xml`
      )
    );
  }

  loadCV():void {
    console.log("loaded cv");
    this.ngOpenCVService.isReady$
      .pipe(
        filter((result: OpenCVLoadResult) => result.ready),
        switchMap(() => {
          return this.classifiersLoaded$;
        }),
        tap(() => {
          // this.clearOutputCanvas();
          // this.findFaceAndEyes();
          // this.readVideo()
        })
      ).subscribe(() => {
        console.log('opencv load ended');
      });
  }
}

  // readVideo():void {
  //   const FPS = 30;
  //   const video:HTMLElement = document.getElementById("video");
  //   const out:HTMLElement = document.getElementById("canvasOutput");
  //   let streaming:boolean = true;
  //   let src:any;
  //   let dst:any;
  //   let cap:any;
  //   //TODO 80% remove
  //   // video.addEventListener('plasy', start);
  //   video.addEventListener('pause', stop);
  //   // TODO 90% remove
  //   // video.addEventListener('ended', stop);
  //   start();
  //   function start() {
  //     console.log('playing...');
  //     // cv.imshow(this.canvasOutput.nativeElement.id, src)
  //     streaming = true;
  //     let exper:any = new cv.Mat(200, 200, cv.CV_8UC4);
  //     console.log("init exper");
  //     const width = video.getAttribute("width");
  //     const height = video.getAttribute("height");
  //     src = new cv.Mat(height, width, cv.CV_8UC4);
  //     dst = new cv.Mat(height, width, cv.CV_8UC1);
  //     console.log("mats init");
  //     cap = new cv.VideoCapture(video);
  //     console.log("cap init");
  //     setTimeout(processVideo, 0);
  //     //??? TODO 
  //     // processVideo()
  //   } 
    
  //   function stop() {
  //     console.log('paused or ended');
  //     streaming = false;
  //   }

  //   function processVideo() {
  //     if (!streaming) {
  //         src.delete();
  //         dst.delete();
  //         console.log("deleted")
  //         return;
  //     }
  //     console.log("images show ---", streaming);
  //     console.log(src);
  //     console.log(dst);
  //     const begin = Date.now();
  //     src.crossOrigin = "Anonymous";
  //     dst.crossOrigin = "Anonymous";
  //     cap.crossOrigin = "Anonymous";
  //     console.log("error cap start");
  //     cap.read(src);
  //     console.log("error cap ended");
  //     cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY);
  //     cv.imshow('canvasOutput', dst);
  //     // cv.imshow('canvasOutput', src);
  //     // cv.imshow(this.canvasOutput.nativeElement.id, src);
  //     const delay = 1000/FPS - (Date.now() - begin);
  //     // console.log(delay)
  //     setTimeout(processVideo, delay);
  //   }
  //   cv.imshow(this.canvasOutput.nativeElement.id, src);
  //   src.delete();
  //   dst.delete();
  //   cap.delete();
  // }