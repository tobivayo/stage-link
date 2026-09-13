import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IonRouterOutlet } from '@ionic/angular';

@Component({
  selector: 'app-shell',
  template: '<ion-router-outlet></ion-router-outlet>',
  imports: [IonRouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShellComponent {}
