import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <h1>Flood Monitor</h1>
      <div class="gear-menu-container">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      .header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background-color: #000;
        color: #f1c40f;
        padding: 10px 20px;
        box-sizing: border-box;
        z-index: 1000;
      }
      .header h1 {
        margin: 0;
        font-size: 2.5em;
      }

      .gear-menu-container {
        position: absolute;
        top: 20px; /* Aligns with the top padding */
        right: 20px; /* Aligns with the right edge */
      }
    `,
  ],
})
export class HeaderComponent {}
