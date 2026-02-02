import { getCustomers } from "@/app/actions/customer-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import {
  ArrowLeft,
  Users,
  UserPlus,
  Search,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input"; // Assuming you have input component
import { CustomerForm } from "@/components/customer-form"; // We need to build this

export default async function CustomersPage() {
  const { data: customers } = await getCustomers();

  return (
    <div className="min-h-screen bg-[#111] p-6 md:p-10 text-white selection:bg-primary selection:text-black">
      <MotionDiv className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/">
              <Button
                variant="ghost"
                className="rounded-full h-10 w-10 sm:h-12 sm:w-12 p-0 text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-white flex items-end gap-2 uppercase">
                CLIENTES{" "}
                <span className="text-primary text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Base de Datos & Fidelización
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <CustomerForm asDialog>
              <Button className="w-full sm:w-auto rounded-full px-6 py-4 sm:py-6 font-bold bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105 transition-all">
                <UserPlus className="h-5 w-5 mr-2" /> NUEVO CLIENTE
              </Button>
            </CustomerForm>
          </div>
        </div>

        {/* Search Bar - Visual only for now, client side filtering to come ideally */}
        <div className="glass-card p-4 rounded-xl flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <Input
              placeholder="Buscar por nombre o teléfono..."
              className="pl-10 bg-black/40 border-white/10 text-white"
            />
          </div>
        </div>

        {/* Customers Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers && customers.length > 0 ? (
            customers.map((customer) => (
              <MotionItem key={customer.id}>
                <Card className="glass-card hover:bg-white/5 transition-colors border-white/5 group">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold flex justify-between items-start">
                      <span>{customer.name}</span>
                      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs text-primary font-bold">
                        {customer.name?.charAt(0).toUpperCase()}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{customer.phone || "Sin teléfono"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{customer.email || "Sin email"}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10 flex justify-between items-center mt-2">
                      <span className="flex items-center gap-1 text-white">
                        <ShoppingBag className="h-4 w-4 text-primary" />
                        Gastado:
                      </span>
                      <span className="font-bold text-green-400">
                        ${Number(customer.totalSpent).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </MotionItem>
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-xl">Aún no hay clientes registrados.</p>
            </div>
          )}
        </div>
      </MotionDiv>
    </div>
  );
}
