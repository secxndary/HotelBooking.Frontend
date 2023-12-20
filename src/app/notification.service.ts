import { Injectable } from '@angular/core';
import { ToastrService, IndividualConfig } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  defaultConfig: Partial<IndividualConfig> = {
    closeButton: true,
    progressBar: true,
    positionClass: 'toast-bottom-right',
    timeOut: 3000
  };

  constructor(private toastr: ToastrService) {}

  showError(message: string, title: string, config?: Partial<IndividualConfig>) {
    const mergedConfig = { ...this.defaultConfig, ...config };
    this.toastr.error(message, title, mergedConfig);
  }

  showSuccess(message: string, title: string, config?: Partial<IndividualConfig>) {
    const mergedConfig = { ...this.defaultConfig, ...config };
    this.toastr.success(message, title, mergedConfig);
  }
}