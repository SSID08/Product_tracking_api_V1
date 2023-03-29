import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Data } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { URLS } from '../urls';

@Component({
  selector: 'app-asset-dialog',
  templateUrl: './asset-dialog.component.html',
  styleUrls: ['./asset-dialog.component.scss']
})
export class AssetDialogComponent implements OnInit {
  stores = [];
  isEdit: Boolean = false;
  aseet= { "type": "", "location": "", "weight": "", "temperature": "", "usebydata": "" };
  buttonText = "Save";
  form = new FormGroup({
    type: new FormControl(''),
    location: new FormControl(''),
    weight: new FormControl(''),
    temperature: new FormControl(''),
    usebydate:new FormControl('')

  });
  httpOptions: any;
  data:any;
  constructor(public dialogRef: MatDialogRef<any, any>,
    @Inject(MAT_DIALOG_DATA) public dialogdata: Data, private snackBar: MatSnackBar, private _http: HttpClient) {
    console.log(dialogdata);
    this.data=dialogdata;
    if (dialogdata) {
      var data = dialogdata;
      this.aseet.type = data['type'];
      this.aseet.location = data['location'];
      this.aseet.weight = data['weight'];
      this.aseet.temperature = data['temperature'];
      this.aseet.usebydata = data['usebydate']
      //var owner = JSON.parse(data['Owner'])
      //this.aseet.Owner = owner.user;
    }

  }
  ngOnInit() {

  }

  onSubmit() {
    console.log(this.form.value);
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'

      })
    }
    if (this.data) {
      var request = { "type": this.form.value.type, "location": this.form.value.location, "weight": this.data.weight, "temperature": this.form.value.temperature, /*"Owner": { "org": "Org1MSP", "user": this.form.value.Owner }*/ };
      this._http.post<any>(URLS.UPDATE, JSON.stringify(request), this.httpOptions).subscribe((data: any) => {
        console.log(data);
       var response = { "type": this.form.value.type, "location": this.form.value.location, "weight": this.data.weight, "temperature": this.form.value.temperature, /*"Owner": JSON.stringify({ "org": "Org1MSP", "user": this.form.value.Owner })*/ };
        this.dialogRef.close(response)
      })
    }else{
      this._http.post<any>(URLS.CREATE, JSON.stringify(this.form.value), this.httpOptions).subscribe((data: any) => {
        console.log(data);
        var response = { "type": this.form.value.type, "location": this.form.value.location, "weight": this.form.value.weight,"temperature": this.form.value.temperature, "usebydate": this.form.value.usebydate, /*"Owner": JSON.stringify({ "org": "Org1MSP", "user": this.form.value.Owner })*/ };
        this.dialogRef.close(response)
      })
    }

  }
  close() {
    this.dialogRef.close();
  }
}
