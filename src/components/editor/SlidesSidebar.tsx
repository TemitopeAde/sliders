import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Plus,
  Copy,
  Trash2,
  EyeOff,
  Image,
  ArrowUp,
  ArrowDown,
  Paintbrush,
} from "lucide-react";
import type { Slide } from "../../schemas/slider";
import { Button, buttonVariants } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../ui/dropdown-menu";
function SortableSlide({
  slide,
  index,
  selected,
  onSelect,
  onDuplicate,
  onDelete,
  onToggle,
  onMove,
  onCopyStyle,
}: {
  slide: Slide;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onMove: (direction: number) => void;
  onCopyStyle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: slide._id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border rounded-lg p-2 mb-2 ${selected ? "bg-blue-50/60 border-blue-400" : "bg-white"} ${slide.enabled ? "" : "opacity-50"}`}
    >
      <div className="flex gap-2 items-center">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Drag ${slide.title}`}
          className="text-gray-400 cursor-grab touch-none"
        >
          <GripVertical size={15} />
        </button>
        <button className="flex-1 min-w-0 text-left" onClick={onSelect}>
          <div className="relative h-20 rounded bg-gray-100 mb-2 overflow-hidden">
            {slide.media.url && slide.type !== "video" ? (
              <img
                src={slide.media.url}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="flex items-center justify-center h-full"
                style={{ background: slide.style.background }}
              >
                <Image className="text-white/70" size={22} />
              </div>
            )}
            <span className="absolute left-1.5 top-1.5 px-1.5 rounded bg-white/90 text-[10px]">
              {String(index + 1).padStart(2, "0")}
            </span>
            {!slide.enabled && (
              <EyeOff className="absolute right-2 top-2 text-white" size={14} />
            )}
          </div>
          <p className="text-xs font-medium mb-1 truncate">{slide.title}</p>
          <p className="text-[10px] text-gray-400 capitalize mb-0">
            {slide.type}
          </p>
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({
              variant: "ghost",
              className: "h-6 w-5",
            })}
            aria-label={`Slide actions: ${slide.title}`}
          >
            ⋮
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onToggle}>
              <EyeOff />
              {slide.enabled ? "Disable" : "Enable"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMove(-1)}>
              <ArrowUp />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMove(1)}>
              <ArrowDown />
              Move down
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onCopyStyle}>
              <Paintbrush />
              Copy style to all slides
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
export function SlidesSidebar({
  slides,
  selected,
  onSelect,
  onChange,
  onAdd,
  onDelete,
}: {
  slides: Slide[];
  selected: string;
  onSelect: (id: string) => void;
  onChange: (slides: Slide[]) => void;
  onAdd: () => void;
  onDelete: (s: Slide) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const move = (from: number, to: number) => {
    if (to >= 0 && to < slides.length) onChange(arrayMove(slides, from, to));
  };
  const end = ({ active, over }: DragEndEvent) => {
    if (over && active.id !== over.id)
      move(
        slides.findIndex((s) => s._id === active.id),
        slides.findIndex((s) => s._id === over.id),
      );
  };
  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold m-0">
          Slides{" "}
          <span className="text-gray-400 font-normal ml-1">
            {slides.length}
          </span>
        </h2>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Add slide"
          onClick={onAdd}
        >
          <Plus size={16} />
        </Button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={end}
      >
        <SortableContext
          items={slides.map((s) => s._id)}
          strategy={verticalListSortingStrategy}
        >
          {slides.map((s, i) => (
            <SortableSlide
              key={s._id}
              slide={s}
              index={i}
              selected={s._id === selected}
              onSelect={() => onSelect(s._id)}
              onDuplicate={() => {
                const copy = {
                  ...structuredClone(s),
                  _id: crypto.randomUUID(),
                  title: `${s.title.slice(0, 150)} (copy)`,
                };
                onChange([
                  ...slides.slice(0, i + 1),
                  copy,
                  ...slides.slice(i + 1),
                ]);
                onSelect(copy._id);
              }}
              onDelete={() => onDelete(s)}
              onToggle={() =>
                onChange(
                  slides.map((v) =>
                    v._id === s._id ? { ...v, enabled: !v.enabled } : v,
                  ),
                )
              }
              onMove={(direction) => move(i, i + direction)}
              onCopyStyle={() =>
                onChange(
                  slides.map((v) => ({
                    ...v,
                    style: structuredClone(s.style),
                  })),
                )
              }
            />
          ))}
        </SortableContext>
      </DndContext>
      <Button
        variant="outline"
        className="w-full mt-3 border-dashed text-xs"
        onClick={onAdd}
      >
        <Plus size={14} />
        Add slide
      </Button>
      <p className="text-[10px] text-gray-400 text-center mt-4">
        Drag to reorder · Select to customize
      </p>
    </>
  );
}
