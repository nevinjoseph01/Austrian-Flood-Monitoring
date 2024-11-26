import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <p>&copy; 2024 Flood Monitor</p>
    </footer>
  `,
  styles: [
    `
      .footer {
        background-color: #000;
        padding: 10px;
        color: #f1c40f;
        text-align: center;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        position: fixed;
        bottom: 0;
        width: 100%;
      }
      .footer p {
        margin: 0;
      }
    `,
  ],
})
export class FooterComponent {}
