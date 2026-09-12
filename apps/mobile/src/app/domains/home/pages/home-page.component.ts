import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonText } from '@ionic/angular';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  imports: [IonText],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {}
