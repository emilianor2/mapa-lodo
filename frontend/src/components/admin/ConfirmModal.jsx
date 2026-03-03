import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Trash2, CheckCircle } from "lucide-react";

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
    // Colores de marca LODO
    const lodoGreen = "#6FEA44";
    const lodoDark = "#59595B";
    const lodoLight = "#f4f4f5";

    // Detectamos si es una acción de eliminación para ajustar visualmente el modal
    const isDeleteAction = title?.toLowerCase().includes("eliminar");

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px] p-0 border-none rounded-[2.5rem] overflow-hidden shadow-2xl" style={{ backgroundColor: '#fff' }}>
                <div className="p-10">
                    <DialogHeader>
                        <div
                            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-8 shadow-inner"
                            style={{ backgroundColor: isDeleteAction ? "#fef2f2" : `${lodoGreen}15` }}
                        >
                            <AlertTriangle
                                className="h-8 w-8"
                                style={{ color: isDeleteAction ? "#ef4444" : lodoGreen }}
                            />
                        </div>
                        <DialogTitle className="text-center text-3xl font-black tracking-tighter mb-4" style={{ color: lodoDark }}>
                            {title || "¿Estás seguro?"}
                        </DialogTitle>
                        <DialogDescription className="text-center text-sm font-bold uppercase tracking-widest opacity-60 leading-relaxed mb-8" style={{ color: lodoDark }}>
                            {message || "Esta acción no se puede deshacer. Por favor, confirma tu decisión."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-4 mt-2">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 font-black uppercase text-[10px] tracking-widest h-12 hover:bg-slate-50"
                            style={{ color: '#59595B80' }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex-1 font-black uppercase text-[10px] tracking-widest h-12 rounded-xl shadow-lg transition-transform active:scale-95"
                            style={{
                                backgroundColor: isDeleteAction ? "#ef4444" : lodoGreen,
                                color: isDeleteAction ? "#ffffff" : "#000000",
                                boxShadow: isDeleteAction ? '0 10px 30px #ef444440' : `0 10px 30px ${lodoGreen}40`
                            }}
                        >
                            {loading ? (
                                "Procesando..."
                            ) : (
                                <>
                                    {isDeleteAction ? "Sí, eliminar" : "Confirmar"}
                                    {isDeleteAction ? (
                                        <Trash2 className="ml-3 h-4 w-4" />
                                    ) : (
                                        <CheckCircle className="ml-3 h-4 w-4" />
                                    )}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}