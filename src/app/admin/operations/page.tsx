import { getWasteLogs } from "@/app/actions/operations-actions";
export const dynamic = "force-dynamic";
import { getIngredients } from "@/app/actions/ingredient-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MotionDiv } from "@/components/ui/motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WasteForm from "./waste-form";
import RefundSearch from "./refund-search";

export default async function OperationsPage() {
  const { data: logs } = await getWasteLogs();
  const ingredients = await getIngredients();

  return (
    <div className="min-h-screen bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black">
      <MotionDiv className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5 mr-2" /> Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              Operaciones y Pérdidas
            </h1>
            <p className="text-gray-400">
              Control de desperdicios y devoluciones.
            </p>
          </div>
        </div>

        <Tabs defaultValue="waste" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="waste">🗑️ Registro de Desperdicio</TabsTrigger>
            <TabsTrigger value="refunds">💸 Devoluciones (Refunds)</TabsTrigger>
          </TabsList>

          {/* WASTE TAB */}
          <TabsContent value="waste" className="space-y-6 mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Log Waste Form */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">
                    Registrar Pérdida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WasteForm ingredients={ingredients} />
                </CardContent>
              </Card>

              {/* Recent Logs Table */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-white">
                    Historial Reciente
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[400px] overflow-y-auto">
                  {!logs || logs.length === 0 ? (
                    <p className="text-gray-500 text-center py-10">
                      No hay registros aún.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3 bg-white/5 rounded-lg border border-white/5 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-bold text-white text-sm">
                              {log.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(log.date).toLocaleDateString()} -
                              {log.ingredient
                                ? ` (${Number(log.quantity)} ${log.ingredient.unit})`
                                : ""}
                            </p>
                          </div>
                          <span className="font-mono text-red-400 font-bold">
                            -${Number(log.cost).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REFUNDS TAB */}
          <TabsContent value="refunds" className="mt-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-white">
                  Buscar Venta para Reembolso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RefundSearch />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </MotionDiv>
    </div>
  );
}
