"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui/icon-button";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/actions/product-actions";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";

interface Props {
  productId: string;
  productName: string;
}

export function DeleteProductButton({ productId, productName }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <IconButton
        icon={<Trash2 className="h-4 w-4" />}
        tooltip="Eliminar producto"
        variant="ghost"
        className="action-btn-danger"
        onClick={() => setOpen(true)}
      />
      
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        icon={<Trash2 className="h-6 w-6 text-red-500" />}
        title={
          <>
            ¿Eliminar <span className="text-red-500">Producto</span>?
          </>
        }
        description={
          <>
            Se eliminará el producto{" "}
            <span className="text-white font-bold italic">{productName}</span> y
            su receta asociada.
          </>
        }
        onConfirm={async () => {
          const res = await deleteProduct(productId);
          if (!res.success) {
            toast.error(res.error);
          } else {
            toast.success("Producto eliminado correctamente");
            router.refresh();
          }
        }}
      />
    </>
  );
}
