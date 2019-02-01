import { Component, OnInit, Input } from '@angular/core';
import { FileUploader } from 'ng2-file-upload/ng2-file-upload';

const URL:string = 'http://localhost:3000/api/upload';

@Component({
  selector: 'app-hello',
  templateUrl: './hello.component.html',
  styleUrls: ['./hello.component.css']
})
export class HelloComponent implements OnInit {

  title:string = 'app-open-files';
  //TODO http://localhost:3000 chnage url to http://localhost:3000
  API:string = "http://localhost:3000/photo-1547647296998..MOV";
  
  public uploader: FileUploader = new FileUploader({url: URL, itemAlias: 'photo'});

  ngOnInit() {
    this.sendFiles();
  }

  sendFiles():void {
    
    this.uploader.onAfterAddingFile = (file) => { file.withCredentials = false; };
    this.uploader.onCompleteItem = (item: any, response: any, status: any, headers: any) => {
         console.log("-------------------------------", this.uploader.getNotUploadedItems().length)
         console.log('ImageUpload:uploaded:', item, status, response);
         alert('File uploaded successfully');
         let jsonRes:any;
         try {
            jsonRes = JSON.parse(response);
            console.log(jsonRes)
         }
         
         catch(err) {
            console.error('Error:', err);
         }
         console.log(jsonRes.filename);
         this.API = "http://localhost:3000";
         this.setApi(this.API + "/" + jsonRes.filename);
     };
  }

  setApi(API:string) {
    this.API = API;
  }

 

}
