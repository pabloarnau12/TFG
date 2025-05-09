import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../service/auth.service';
import { Router } from '@angular/router';
import { ImageUploadService } from '../../../../service/image-upload.service';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ordersService } from '../../../../service/orders.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-perfil-repartidor',
  standalone: true,
  imports: [
    FormsModule,
    MatMenuModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    DatePipe,
  ],
  templateUrl: './perfil-repartidor.component.html',
  styleUrl: './perfil-repartidor.component.css',
})
export class PerfilRepartidorComponent implements OnInit {
  user: any = {};
  selectedFile: File | null = null;
  isloading: Boolean = false;
  pedidos: any[] = [];
  pedidoSeleccionado: any = null; 
  mostrarProductos: boolean = false; 

 
  toggleProductos(): void {
    this.mostrarProductos = !this.mostrarProductos;
  }
  ngOnInit(): void {
    this.loadProfile();
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private imageUploadService: ImageUploadService,
    private pedidosService: ordersService
  ) {}
  verificarPedidoAsignado(): void {
    this.pedidosService.getPedidoAsignado(this.user.ID_Usuario).subscribe(
      (pedido) => {
        this.pedidoSeleccionado = pedido;
      },
      (error) => {
        if (error.status === 404) {
          this.loadOrders();
        } else {
          console.error('Error al verificar el pedido asignado', error);
        }
      }
    );
  }
  loadProfile(): void {
    const token = localStorage.getItem('token');
    if (token) {
      this.authService.getProfile(token).subscribe(
        (profile) => {
          this.user = profile;

          this.verificarPedidoAsignado(); 
        },
        (error) => {
          console.error('Error al cargar el perfil', error);
          this.onLogout();
        }
      );
    } else {
      console.error('No se encontró el token');
      this.onLogout();
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/home']).then(() => {
      window.location.reload();
    });
  }

  secondOportunityLogout() {
    Swal.fire({
      title: '¿Seguro que quieres marcharte?',
      showDenyButton: true,
      showCancelButton: true,
      showConfirmButton: false,
      denyButtonText: `Cerrar Sesión`,
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isDenied) {
        this.onLogout(); 
      }
    });
  }

  onFileChange(event: any) {
    this.selectedFile = event.target.files[0];
  }
  onSubmit() {
    if (this.selectedFile) {
      this.isloading = true;
      this.imageUploadService.uploadProfileImage(this.selectedFile).subscribe({
        next: (response: any) => {
          this.loadProfile();
          this.isloading = false;
        },
        error: (error) => {
          console.error('Error al subir la imagen:', error);
        },
      });
    }
  }

  updateStatus(newStatus: string): void {
    this.isloading = true;
    const token = localStorage.getItem('token');

    if (token) {
      this.authService.updateStatus({ status: newStatus }, token).subscribe(
        (response) => {
          this.user.estado = newStatus;
          Swal.fire(
            'Estado actualizado',
            `Tu estado ahora es: ${newStatus}`,
            'success'
          );
          this.isloading = false;
          this.loadProfile();
        },
        (error) => {
          console.error('Error al actualizar el estado', error);
          Swal.fire(
            'Error',
            'No se pudo actualizar tu estado. Intenta de nuevo.',
            'error'
          );
          this.isloading = false;
        }
      );
    } else {
      console.error('No se encontró el token');
      this.onLogout();
    }
  }

  loadOrders() {
    this.pedidosService.OrdersByState('Pendiente').subscribe(
      (response) => {
        this.pedidos = response;
      },
      (error) => {
        console.error('Error: ', error);
      }
    );
  }

  aceptarPedido(pedido: any): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres aceptar este pedido?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidosService
          .acceptOrder(pedido.ID_Pedido, this.user.ID_Usuario)
          .subscribe(
            (response) => {
              Swal.fire(
                'Pedido aceptado',
                'Has aceptado el pedido con éxito.',
                'success'
              );
              this.pedidoSeleccionado = pedido;
              this.updateStatus('ocupado');
            },
            (error) => {
              console.error('Error al aceptar el pedido', error);
              Swal.fire('Error', 'No se pudo aceptar el pedido.', 'error');
            }
          );
      }
    });
  }

  pedidoEntregado(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres finalizar este pedido?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidosService
          .finishOrder(this.pedidoSeleccionado.ID_Pedido)
          .subscribe(
            (response) => {
              Swal.fire(
                'Pedido finalizado',
                'Has finalizado el pedido con éxito.',
                'success'
              );
              this.pedidoSeleccionado = null; 
              this.updateStatus('activo'); 
              this.loadOrders(); 
            },
            (error) => {
              console.error('Error al finalizar el pedido', error);
              Swal.fire('Error', 'No se pudo finalizar el pedido.', 'error');
            }
          );
      }
    });
  }

  pedidoEnCamino(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Quieres marcar este pedido como "En Camino"?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.pedidosService
          .updateOrderStatus(this.pedidoSeleccionado.ID_Pedido, 'En Camino')
          .subscribe(
            (response) => {
              Swal.fire(
                'Estado actualizado',
                'El pedido ahora está "En Camino".',
                'success'
              );
              this.pedidoSeleccionado.Estado_Pedido = 'En Camino'; 
            },
            (error) => {
              console.error('Error al actualizar el estado del pedido', error);
              Swal.fire(
                'Error',
                'No se pudo actualizar el estado del pedido.',
                'error'
              );
            }
          );
      }
    });
  }
}
