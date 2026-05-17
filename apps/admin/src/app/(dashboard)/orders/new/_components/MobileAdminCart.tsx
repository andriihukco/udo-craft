import { Badge } from "@/components/ui/badge";

export function MobileAdminCart({ cart, totalCents, onEdit, onRemove, onCheckout }: MobileAdminCartProps) {
  const [open, setOpen] = useState(false);
  if (cart.length === 0) return null;

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-4 pt-4 pb-6 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
        <button 
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-4 bg-primary text-primary-foreground rounded-2xl px-5 py-4 shadow-lg shadow-primary/20 active:scale-[0.97] transition-all duration-300"
        >
          <div className="relative shrink-0 size-10 rounded-xl bg-white/20 flex items-center justify-center">
            <ShoppingCart className="size-5" />
            <span className="absolute -top-1.5 -right-1.5 bg-foreground text-background text-[10px] font-black rounded-full min-w-5 h-5 flex items-center justify-center border-2 border-primary">{cart.length}</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Кошик замовлення</p>
            <p className="text-sm font-bold">₴{(totalCents / 100).toFixed(0)} · {cart.length} шт</p>
          </div>
          <ChevronRight className="size-5 opacity-40 shrink-0" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-background rounded-t-[2.5rem] flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-full duration-500">
            <div className="flex justify-center pt-4 pb-2 shrink-0"><div className="w-12 h-1.5 rounded-full bg-muted" /></div>
            
            <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-border/40">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">Кошик</h3>
                <p className="text-[10px] font-bold text-muted-foreground">{cart.length} позицій у списку</p>
              </div>
              <button 
                onClick={() => setOpen(false)} 
                className="size-10 flex items-center justify-center rounded-xl bg-muted/40 hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {cart.map((item, i) => {
                const lineTotal = (item.unitPriceCents + item.printCostCents) * item.quantity / 100;
                const mockupKeys = item.mockupsMap ? Object.keys(item.mockupsMap).filter((k) => item.mockupsMap![k]) : [];
                
                return (
                  <div key={i} className="flex flex-col gap-4 p-4 rounded-3xl bg-muted/20 border border-border/40 animate-in fade-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="shrink-0 size-24 bg-white rounded-2xl border border-border/40 p-1.5 shadow-sm">
                        <img 
                          src={item.mockupsMap?.[mockupKeys[0]] || item.mockupDataUrl || item.productImage} 
                          alt={item.productName} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      
                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-sm font-bold text-foreground truncate">{item.productName}</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="h-5 text-[9px] px-1.5">{item.size}</Badge>
                          <Badge variant="outline" className="h-5 text-[9px] px-1.5">{item.color}</Badge>
                        </div>
                        <div className="flex items-end justify-between mt-2">
                          <span className="text-xs font-bold text-muted-foreground">{item.quantity} шт</span>
                          <span className="text-base font-black text-primary">₴{lineTotal.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 h-10 rounded-xl text-[10px] font-bold uppercase tracking-widest border-border/60"
                        onClick={() => { setOpen(false); onEdit(i); }}
                      >
                        Редагувати
                      </Button>
                      <Button 
                        variant="outline"
                        className="size-10 rounded-xl border-border/60 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all shrink-0"
                        onClick={() => onRemove(i)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="shrink-0 p-6 border-t border-border/40 bg-background/80 backdrop-blur-md space-y-4 pb-10">
              <div className="flex items-end justify-between px-1">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Загальна сума</p>
                  <p className="text-2xl font-black text-foreground tracking-tighter">₴{(totalCents / 100).toFixed(0)}</p>
                </div>
                <Badge variant="secondary" className="font-bold bg-muted/40 h-6">
                  {cart.length} товарів
                </Badge>
              </div>
              <Button 
                className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 gap-3" 
                onClick={() => { setOpen(false); onCheckout(); }}
              >
                <span>Оформити замовлення</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

