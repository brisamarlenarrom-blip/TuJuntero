// Servicio de Firebase Firestore: reemplaza a ApiService para guardar datos
import { Injectable } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  constructor(private firestore: Firestore) {}

  // ============ MÉTODOS GENÉRICOS PARA CUALQUIER COLECCIÓN ============

  // Obtiene todos los documentos de una colección
  getCollection(coleccion: string): Observable<any[]> {
    const col = collection(this.firestore, coleccion);
    return collectionData(col, { idField: 'id' }) as Observable<any[]>;
  }

  // Obtiene documentos filtrados por un campo
  getByField(coleccion: string, campo: string, valor: string): Observable<any[]> {
    const col = collection(this.firestore, coleccion);
    const q = query(col, where(campo, '==', valor));
    return collectionData(q, { idField: 'id' }) as Observable<any[]>;
  }

  // Obtiene un documento por su ID
  getById(coleccion: string, id: string): Observable<any> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return docData(docRef, { idField: 'id' });
  }

  // Crea un nuevo documento
  create(coleccion: string, data: any): Promise<any> {
    const col = collection(this.firestore, coleccion);
    return addDoc(col, data);
  }

  // Actualiza un documento existente
  update(coleccion: string, id: string, data: any): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return updateDoc(docRef, data);
  }

  // Elimina un documento
  delete(coleccion: string, id: string): Promise<void> {
    const docRef = doc(this.firestore, `${coleccion}/${id}`);
    return deleteDoc(docRef);
  }
}