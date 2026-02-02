import { getExpenses, getExpenseStats } from "@/app/actions/expense-actions";
import { ExpenseForm } from "@/components/expense-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MotionDiv, MotionItem } from "@/components/ui/motion";
import { ArrowLeft, ArrowDown, Wallet, Calendar, Pencil } from "lucide-react";
import Link from "next/link";
import { DeleteExpenseButton } from "./delete-expense-button";

export default async function ExpensesPage() {
  const { data: expenses } = await getExpenses();
  const stats = await getExpenseStats();

  return (
    <div className="min-h-screen bg-black p-4 md:p-12 text-white selection:bg-primary selection:text-black">
      <MotionDiv className="max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <MotionItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/5">
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
                GASTOS{" "}
                <span className="text-red-500 text-4xl sm:text-6xl leading-none">
                  .
                </span>
              </h1>
              <p className="text-xs sm:text-base text-neutral-500 font-medium tracking-wide">
                Control de salidas de dinero
              </p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <ExpenseForm />
          </div>
        </MotionItem>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <MotionItem>
            <Card className="glass-card border-white/5 bg-zinc-900/20 p-6 h-full flex flex-col justify-between group hover:border-white/10 transition-all">
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">
                  Total Mes Actual
                </p>
                <div className="text-4xl font-black text-white flex items-center gap-2 tracking-tight">
                  ${stats.total.toFixed(2)}
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <ArrowDown className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </div>
            </Card>
          </MotionItem>
          <MotionItem>
            <Card className="glass-card border-white/5 bg-zinc-900/20 p-6 h-full flex flex-col justify-between group hover:border-white/10 transition-all">
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">
                  Gastos Fijos
                </p>
                <div className="text-3xl font-black text-white tracking-tight mb-2">
                  ${stats.fixed.toFixed(2)}
                </div>
                <p className="text-xs text-neutral-600 font-medium">
                  Alquiler, Servicios, Sueldos
                </p>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-blue-500/50 w-1/2" />
              </div>
            </Card>
          </MotionItem>
          <MotionItem>
            <Card className="glass-card border-white/5 bg-zinc-900/20 p-6 h-full flex flex-col justify-between group hover:border-white/10 transition-all">
              <div>
                <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">
                  Movimientos Varios
                </p>
                <div className="text-3xl font-black text-white tracking-tight mb-2">
                  ${stats.variable.toFixed(2)}
                </div>
                <p className="text-xs text-neutral-600 font-medium">
                  Insumos, Mantenimiento, etc
                </p>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-orange-500/50 w-1/2" />
              </div>
            </Card>
          </MotionItem>
        </div>

        {/* List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-white/5">
            <div className="h-10 w-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5">
              <Wallet className="h-5 w-5 text-neutral-400" />
            </div>
            <h2 className="text-xl font-bold text-white uppercase tracking-wide">
              Historial de Gastos
            </h2>
          </div>

          {expenses && expenses.length > 0 ? (
            <MotionDiv className="grid gap-3">
              {expenses.map((expense) => (
                <MotionItem
                  key={expense.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-zinc-900/30 border border-white/5 hover:bg-zinc-900/60 hover:border-white/10 transition-all group"
                >
                  <div className="flex items-center gap-4 sm:gap-5 flex-1">
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${expense.isFixed ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : "bg-orange-500/10 text-orange-500 border border-orange-500/20"}`}
                    >
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-base sm:text-lg truncate">
                        {expense.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-1">
                        <span
                          className={
                            expense.isFixed
                              ? "text-blue-400"
                              : "text-orange-400"
                          }
                        >
                          {expense.category}
                        </span>
                        <span className="text-neutral-600 hidden sm:inline">
                          •
                        </span>
                        <span className="text-neutral-500">
                          {new Date(expense.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 border-t border-white/5 sm:border-none pt-3 sm:pt-0">
                    <span className="font-black text-lg sm:text-xl text-white tracking-tight">
                      -${Number(expense.amount).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <ExpenseForm
                        expense={{
                          id: expense.id,
                          description: expense.description || "",
                          amount: Number(expense.amount),
                          category: expense.category,
                          isFixed: expense.isFixed,
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full bg-white/5 text-neutral-400 hover:text-white hover:bg-white/20"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <DeleteExpenseButton
                        expenseId={expense.id}
                        description={expense.description || ""}
                      />
                    </div>
                  </div>
                </MotionItem>
              ))}
            </MotionDiv>
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
              <div className="h-20 w-20 rounded-full bg-zinc-900 mx-auto flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-neutral-700" />
              </div>
              <p className="text-neutral-500 font-medium">
                No hay gastos registrados aún.
              </p>
            </div>
          )}
        </div>
      </MotionDiv>
    </div>
  );
}
