import os
import threading
import tkinter as tk
from tkinter import filedialog, messagebox, ttk

from pipeline_excel_sync import CLEAN_CSV, NEW_REVIEW_CSV, run_load, run_pipeline


class ExcelSyncApp:
    def __init__(self, root):
        self.root = root
        self.root.title("LODO - Gestor de Excel")
        self.root.geometry("820x560")
        self.root.configure(bg="#f4f4f5")

        self.source_path = tk.StringVar()
        self.status_text = tk.StringVar(value="Elegí un Excel o CSV para empezar.")
        self.summary_vars = {
            "total_rows": tk.StringVar(value="-"),
            "new_candidate_rows": tk.StringVar(value="-"),
            "existing_candidate_rows": tk.StringVar(value="-"),
            "review_queue_count": tk.StringVar(value="-"),
            "unique_countries_count": tk.StringVar(value="-"),
        }
        self.current_summary = None

        self._build_ui()

    def _build_ui(self):
        wrapper = tk.Frame(self.root, bg="#f4f4f5", padx=24, pady=24)
        wrapper.pack(fill="both", expand=True)

        title = tk.Label(wrapper, text="Gestor de carga de Excel", font=("Montserrat", 24, "bold"), bg="#f4f4f5", fg="#59595B")
        title.pack(anchor="w")

        subtitle = tk.Label(
            wrapper,
            text="Procesa el Excel y sube solo startups nuevas. Las existentes no se modifican.",
            font=("Montserrat", 10, "bold"),
            bg="#f4f4f5",
            fg="#59595B",
        )
        subtitle.pack(anchor="w", pady=(4, 20))

        picker_frame = tk.Frame(wrapper, bg="#f4f4f5")
        picker_frame.pack(fill="x")

        path_entry = tk.Entry(picker_frame, textvariable=self.source_path, font=("Segoe UI", 10), relief="flat", bg="white", fg="#59595B")
        path_entry.pack(side="left", fill="x", expand=True, ipady=10)

        browse_button = tk.Button(
            picker_frame,
            text="Elegir archivo",
            command=self.select_file,
            bg="#6FEA44",
            fg="#000000",
            relief="flat",
            font=("Montserrat", 10, "bold"),
            padx=16,
            pady=10,
        )
        browse_button.pack(side="left", padx=(12, 0))

        actions_frame = tk.Frame(wrapper, bg="#f4f4f5")
        actions_frame.pack(fill="x", pady=(18, 18))

        self.process_button = tk.Button(
            actions_frame,
            text="1. Procesar archivo",
            command=self.process_selected_file,
            bg="#59595B",
            fg="white",
            relief="flat",
            font=("Montserrat", 10, "bold"),
            padx=16,
            pady=10,
        )
        self.process_button.pack(side="left")

        self.open_review_button = tk.Button(
            actions_frame,
            text="Abrir revisión de nuevas",
            command=lambda: self.open_file(NEW_REVIEW_CSV),
            state="disabled",
            bg="white",
            fg="#59595B",
            relief="flat",
            font=("Montserrat", 10, "bold"),
            padx=16,
            pady=10,
        )
        self.open_review_button.pack(side="left", padx=(12, 0))

        self.open_clean_button = tk.Button(
            actions_frame,
            text="Abrir CSV limpio",
            command=lambda: self.open_file(CLEAN_CSV),
            state="disabled",
            bg="white",
            fg="#59595B",
            relief="flat",
            font=("Montserrat", 10, "bold"),
            padx=16,
            pady=10,
        )
        self.open_clean_button.pack(side="left", padx=(12, 0))

        stats_frame = tk.Frame(wrapper, bg="#f4f4f5")
        stats_frame.pack(fill="x", pady=(0, 18))

        cards = [
            ("Filas totales", "total_rows"),
            ("Nuevas", "new_candidate_rows"),
            ("Ya existentes", "existing_candidate_rows"),
            ("Nuevas a revisar", "review_queue_count"),
            ("Países", "unique_countries_count"),
        ]

        for index, (label, key) in enumerate(cards):
            card = tk.Frame(stats_frame, bg="white", padx=16, pady=14)
            card.grid(row=0, column=index, padx=6, sticky="nsew")
            stats_frame.grid_columnconfigure(index, weight=1)
            tk.Label(card, text=label, bg="white", fg="#59595B", font=("Montserrat", 9, "bold")).pack(anchor="w")
            tk.Label(card, textvariable=self.summary_vars[key], bg="white", fg="#59595B", font=("Montserrat", 20, "bold")).pack(anchor="w", pady=(8, 0))

        status_box = tk.Frame(wrapper, bg="white", padx=16, pady=14)
        status_box.pack(fill="x")
        tk.Label(status_box, text="Estado", bg="white", fg="#59595B", font=("Montserrat", 9, "bold")).pack(anchor="w")
        tk.Label(status_box, textvariable=self.status_text, bg="white", fg="#59595B", font=("Segoe UI", 10), justify="left", wraplength=760).pack(anchor="w", pady=(8, 0))

        upload_frame = tk.Frame(wrapper, bg="#f4f4f5")
        upload_frame.pack(fill="x", pady=(18, 0))

        self.upload_new_button = tk.Button(
            upload_frame,
            text="2. Subir nuevas revisadas",
            command=self.upload_only_new,
            state="disabled",
            bg="#6FEA44",
            fg="#000000",
            relief="flat",
            font=("Montserrat", 10, "bold"),
            padx=16,
            pady=10,
        )
        self.upload_new_button.pack(side="left")

    def set_busy(self, busy, status_message=None):
        state = "disabled" if busy else "normal"
        self.process_button.config(state=state)
        self.open_review_button.config(state="disabled" if busy or self.current_summary is None else "normal")
        self.open_clean_button.config(state="disabled" if busy or self.current_summary is None else "normal")
        can_upload_new = bool(self.current_summary and self.current_summary.get("new_candidate_rows", 0) > 0 and not busy)
        self.upload_new_button.config(state="normal" if can_upload_new else "disabled")
        if status_message:
            self.status_text.set(status_message)

    def select_file(self):
        path = filedialog.askopenfilename(
            title="Elegir Excel o CSV",
            filetypes=[("Archivos Excel", "*.xlsx *.xlsm *.xls"), ("CSV", "*.csv"), ("Todos", "*.*")],
        )
        if path:
            self.source_path.set(path)

    def process_selected_file(self):
        path = self.source_path.get().strip()
        if not path:
            messagebox.showwarning("Falta archivo", "Elegí un Excel o CSV antes de procesar.")
            return
        if not os.path.exists(path):
            messagebox.showerror("Archivo no encontrado", "La ruta seleccionada no existe.")
            return

        self.set_busy(True, "Procesando archivo y detectando solo startups nuevas...")
        threading.Thread(target=self._run_process, args=(path,), daemon=True).start()

    def _run_process(self, path):
        try:
            result = run_pipeline(source_path=path, extract=False)
            self.root.after(0, lambda: self.on_process_success(result["summary"]))
        except Exception as error:
            self.root.after(0, lambda: self.on_process_error(error))

    def on_process_success(self, summary):
        self.current_summary = summary
        for key, variable in self.summary_vars.items():
            variable.set(summary.get(key, "-"))

        self.set_busy(
            False,
            (
                f"Listo. {summary['new_candidate_rows']} nuevas y "
                f"{summary['existing_candidate_rows']} ya existentes. "
                "Las startups existentes no se modifican. Si editás el CSV de revisión de nuevas y lo guardás, ese mismo archivo es el que se sube."
            ),
        )

    def on_process_error(self, error):
        self.current_summary = None
        self.set_busy(False, f"Error al procesar: {error}")
        messagebox.showerror("Error", f"No se pudo procesar el archivo.\n\n{error}")

    def upload_only_new(self):
        if not self.current_summary or self.current_summary.get("new_candidate_rows", 0) <= 0:
            messagebox.showinfo("Sin nuevas", "No hay startups nuevas para subir.")
            return

        if not messagebox.askyesno(
            "Confirmar subida de nuevas",
            (
                "Se va a subir exactamente el archivo de revisión de nuevas.\n\n"
                "Las startups existentes no se tocan ni se actualizan.\n\n"
                "¿Querés continuar?"
            ),
        ):
            return

        self.set_busy(True, "Subiendo nuevas revisadas a MariaDB...")
        threading.Thread(target=self._run_upload_only_new, daemon=True).start()

    def _run_upload_only_new(self):
        try:
            run_load(NEW_REVIEW_CSV, truncate=False)
            self.root.after(0, lambda: self.on_upload_success("Se subió el archivo revisado de startups nuevas."))
        except Exception as error:
            self.root.after(0, lambda: self.on_upload_error(error))

    def on_upload_success(self, message):
        self.set_busy(False, message)
        messagebox.showinfo("Listo", message)

    def on_upload_error(self, error):
        self.set_busy(False, f"Error al subir datos: {error}")
        messagebox.showerror("Error", f"No se pudo subir a la base.\n\n{error}")

    def open_file(self, path):
        if not os.path.exists(path):
            messagebox.showwarning("Archivo no encontrado", f"No existe:\n{path}")
            return
        os.startfile(path)


def main():
    root = tk.Tk()
    style = ttk.Style()
    try:
        style.theme_use("clam")
    except Exception:
        pass
    ExcelSyncApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
