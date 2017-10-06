import { Component, OnInit } from '@angular/core';
import { Teacher }           from '../../models/teacher';

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
    const teachers = await Teacher.find()
    this.teacher = teachers.length ? teachers[0] : new Teacher();
  }

  save() {
    console.log("Save teacher " + this.teacher.name);
    this.teacher.save();
  }

}
