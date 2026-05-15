import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CloudinaryService {

  private readonly cloudName    = 'dgoqhsael';
  private readonly uploadPreset = 'cottoncart';

  /**
   * Upload a File object to Cloudinary via unsigned preset.
   * Returns the permanent secure_url.
   */
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', 'cottoncart');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) {
      let msg = 'Upload failed';
      try { msg = (await res.json()).error?.message ?? msg; } catch { /* ignore */ }
      throw new Error(msg);
    }

    const data = await res.json();
    return data.secure_url as string;
  }
}
