import { Component, OnInit } from '@angular/core';
import { Teacher }           from '../../models/teacher';
import { Reason }            from '../../models/reason';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  title = `App works !`;
  teacher: Teacher;

  constructor() { }

  async ngOnInit() {
    const teachers = [];
    let reason = new Reason();
    this.teacher = teachers.length ? teachers[0] : new Teacher();
  }

  async save() {
    // const teachers = await Teacher.find({ _id: this.teacher.name });
    console.log(await Teacher.all());
    // console.log(await this.teacher.save());
  }

}
