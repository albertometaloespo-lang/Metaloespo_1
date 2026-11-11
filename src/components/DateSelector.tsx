import React, { useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
}

export const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onSelectDate }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Gera uma janela de 15 dias (7 antes, hoje, 7 depois)
  const daysList = React.useMemo(() => {
    const list: { dateStr: string; dayName: string; dayNum: number; isToday: boolean }[] = [];
    const base = new Date();

    const formatYMD = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = formatYMD(base);

    const weekDaysPT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let offset = -7; offset <= 7; offset++) {
      const d = new Date(base);
      d.setDate(base.getDate() + offset);
      const str = formatYMD(d);
      list.push({
        dateStr: str,
        dayName: weekDaysPT[d.getDay()],
        dayNum: d.getDate(),
        isToday: str === todayStr,
      });
    }
    return list;
  }, []);

  // Formatar a data selecionada por extenso
  const formattedFullDate = React.useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      const dayNames = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado',
      ];
      const monthNames = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];

      const prefix = isToday ? 'Hoje, ' : isYesterday ? 'Ontem, ' : '';
      return `${prefix}${dayNames[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`;
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const handlePrevDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() - 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const parts = selectedDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setDate(d.getDate() + 1);
    onSelectDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    onSelectDate(new Date().toISOString().split('T')[0]);
  };

  // Rolar automaticamente para o item ativo no scroller horizontal
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [selectedDate]);

  return (
    <div className="bg-white border-b border-slate-200 shadow-xs">
      {/* Barra superior de navegação da data */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-2 max-w-6xl mx-auto">
        <button
          onClick={handlePrevDay}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          aria-label="Dia anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <label className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 cursor-pointer transition-colors text-slate-800">
            <CalendarIcon className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate max-w-[200px] sm:max-w-none">
              {formattedFullDate}
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </label>

          {selectedDate !== new Date().toISOString().split('T')[0] && (
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors"
            >
              Hoje
            </button>
          )}
        </div>

        <button
          onClick={handleNextDay}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors"
          aria-label="Dia seguinte"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scroller horizontal táctil de dias */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto no-scrollbar scroll-smooth max-w-6xl mx-auto"
      >
        {daysList.map((item) => {
          const isSelected = item.dateStr === selectedDate;
          return (
            <button
              key={item.dateStr}
              data-active={isSelected}
              onClick={() => onSelectDate(item.dateStr)}
              className={`flex flex-col items-center justify-center min-w-[48px] py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                  : item.isToday
                  ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {item.dayName}
              </span>
              <span className="text-base font-bold tabular-nums leading-tight mt-0.5">
                {item.dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
