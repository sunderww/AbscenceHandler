import { Component, Input }   from '@angular/core';
import { Teacher }            from '../../../models/teacher';

@Component({
  selector: 'app-teacher-edit',
  templateUrl: './teacher.component.html',
  styleUrls: ['./teacher.component.scss']
})
export class TeacherEditComponent {

  @Input()
  teacher: Teacher;

}
