import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { Polygon } from "geojson"
import {
  ArrowLeft,
  ExternalLink,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react"
import { useCallback, useMemo, useState } from "react"

import { AdminDrawMap } from "@/components/admin-draw-map"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCourseRecords } from "@/hooks/use-course-records"
import {
  deleteCourse,
  emptyCourseProperties,
  nextCourseOrder,
  reorderCourses,
  saveCourse,
} from "@/lib/course-repository"
import { coursePropertiesSchema } from "@/lib/geo-schema"
import { cn } from "@/lib/utils"
import type { CourseGeometry, CourseProperties, CourseRecord } from "@/types/geo"

type AdminMode =
  | { type: "list" }
  | { type: "add" }
  | { type: "edit"; record: CourseRecord }

type CourseFormValues = {
  [Property in keyof CourseProperties]: string
}

type CourseFormErrors = Partial<Record<keyof CourseFormValues | "geometry", string>>

function polygonFromGeometry(geometry: CourseGeometry): Polygon {
  if (geometry.type === "Polygon") {
    return geometry
  }

  return {
    type: "Polygon",
    coordinates: geometry.coordinates[0],
  }
}

function formValuesFromProperties(properties: CourseProperties): CourseFormValues {
  return {
    name: properties.name,
    designer: properties.designer,
    description: properties.description,
    ross_comments: properties.ross_comments,
    par: String(properties.par),
    yardage: String(properties.yardage),
    slope_rating: String(properties.slope_rating),
    course_rating: String(properties.course_rating),
    link_out: properties.link_out,
    order: String(properties.order),
  }
}

function propertiesFromForm(values: CourseFormValues): CourseProperties {
  return {
    name: values.name,
    designer: values.designer,
    description: values.description,
    ross_comments: values.ross_comments,
    par: Number(values.par),
    yardage: Number(values.yardage),
    slope_rating: Number(values.slope_rating),
    course_rating: Number(values.course_rating),
    link_out: values.link_out,
    order: Number(values.order),
  }
}

function fieldError(errors: CourseFormErrors, field: keyof CourseFormValues) {
  return errors[field] ? (
    <p className="mt-1 text-xs leading-5 text-red-700">{errors[field]}</p>
  ) : null
}

function SortableCourseRow({
  onDelete,
  onEdit,
  record,
}: {
  onDelete: (record: CourseRecord) => void
  onEdit: (record: CourseRecord) => void
  record: CourseRecord
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: record.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "grid gap-3 border border-emerald-950/10 bg-background p-4 shadow-sm md:grid-cols-[auto_1fr_auto] md:items-center",
        isDragging && "relative z-10 shadow-xl",
      )}
    >
      <button
        className="flex size-9 items-center justify-center border border-emerald-950/10 text-muted-foreground transition-colors hover:bg-emerald-50 hover:text-emerald-900"
        type="button"
        aria-label={`Reorder ${record.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
          Rank #{record.order}
        </p>
        <h3 className="mt-1 font-serif text-2xl leading-none text-foreground">
          {record.name}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Designed by {record.properties.designer}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 md:justify-end">
        <Button size="sm" variant="outline" onClick={() => onEdit(record)}>
          <Pencil />
          Edit
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={record.properties.link_out} target="_blank" rel="noreferrer">
            <ExternalLink />
            Site
          </a>
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDelete(record)}>
          <Trash2 />
          Delete
        </Button>
      </div>
    </div>
  )
}

function CourseForm({
  mode,
  onCancel,
  onSaved,
  records,
}: {
  mode: Extract<AdminMode, { type: "add" | "edit" }>
  onCancel: () => void
  onSaved: () => void
  records: CourseRecord[]
}) {
  const initialProperties = useMemo(
    () =>
      mode.type === "edit"
        ? mode.record.properties
        : emptyCourseProperties(nextCourseOrder(records)),
    [mode, records],
  )
  const [values, setValues] = useState<CourseFormValues>(() =>
    formValuesFromProperties(initialProperties),
  )
  const [geometry, setGeometry] = useState<Polygon | null>(() =>
    mode.type === "edit" ? polygonFromGeometry(mode.record.geometry) : null,
  )
  const [errors, setErrors] = useState<CourseFormErrors>({})
  const [isSaving, setIsSaving] = useState(false)
  const handleGeometryChange = useCallback((nextGeometry: Polygon | null) => {
    setGeometry(nextGeometry)
  }, [])
  const setField = (field: keyof CourseFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
  }
  const handleSubmit = async () => {
    const nextProperties = propertiesFromForm(values)
    const result = coursePropertiesSchema.safeParse(nextProperties)
    const nextErrors: CourseFormErrors = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]

        if (typeof field === "string") {
          nextErrors[field as keyof CourseFormValues] = issue.message
        }
      }
    }

    if (!geometry) {
      nextErrors.geometry = "Draw a course polygon before saving."
    }

    setErrors(nextErrors)

    if (!result.success || !geometry) {
      return
    }

    setIsSaving(true)

    try {
      await saveCourse({
        existingId: mode.type === "edit" ? mode.record.id : undefined,
        geometry,
        properties: result.data,
      })
      onSaved()
    } catch (error) {
      setErrors({
        geometry:
          error instanceof Error ? error.message : "Course could not be saved.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)]">
      <section className="border border-emerald-950/10 bg-background p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
              {mode.type === "edit" ? "Edit feature" : "New feature"}
            </p>
            <h2 className="mt-2 font-serif text-3xl leading-none">
              {mode.type === "edit" ? values.name : "Add a course"}
            </h2>
          </div>
          <Button size="sm" variant="outline" onClick={onCancel}>
            <ArrowLeft />
            Back
          </Button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
            />
            {fieldError(errors, "name")}
          </div>
          <div>
            <Label htmlFor="designer">Designer</Label>
            <Input
              id="designer"
              value={values.designer}
              onChange={(event) => setField("designer", event.target.value)}
            />
            {fieldError(errors, "designer")}
          </div>
          <div>
            <Label htmlFor="order">Rank</Label>
            <Input
              id="order"
              inputMode="numeric"
              type="number"
              value={values.order}
              onChange={(event) => setField("order", event.target.value)}
            />
            {fieldError(errors, "order")}
          </div>
          <div>
            <Label htmlFor="par">Par</Label>
            <Input
              id="par"
              inputMode="numeric"
              type="number"
              value={values.par}
              onChange={(event) => setField("par", event.target.value)}
            />
            {fieldError(errors, "par")}
          </div>
          <div>
            <Label htmlFor="yardage">Yardage</Label>
            <Input
              id="yardage"
              inputMode="numeric"
              type="number"
              value={values.yardage}
              onChange={(event) => setField("yardage", event.target.value)}
            />
            {fieldError(errors, "yardage")}
          </div>
          <div>
            <Label htmlFor="slope_rating">Slope Rating</Label>
            <Input
              id="slope_rating"
              inputMode="numeric"
              type="number"
              value={values.slope_rating}
              onChange={(event) =>
                setField("slope_rating", event.target.value)
              }
            />
            {fieldError(errors, "slope_rating")}
          </div>
          <div>
            <Label htmlFor="course_rating">Course Rating</Label>
            <Input
              id="course_rating"
              inputMode="decimal"
              step="0.1"
              type="number"
              value={values.course_rating}
              onChange={(event) =>
                setField("course_rating", event.target.value)
              }
            />
            {fieldError(errors, "course_rating")}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="link_out">Course URL</Label>
            <Input
              id="link_out"
              value={values.link_out}
              onChange={(event) => setField("link_out", event.target.value)}
            />
            {fieldError(errors, "link_out")}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
            />
            {fieldError(errors, "description")}
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ross_comments">Ross Comments</Label>
            <Textarea
              id="ross_comments"
              value={values.ross_comments}
              onChange={(event) =>
                setField("ross_comments", event.target.value)
              }
            />
            {fieldError(errors, "ross_comments")}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSaving}>
            <Save />
            {isSaving ? "Saving..." : "Save feature"}
          </Button>
        </div>
      </section>

      <section className="border border-emerald-950/10 bg-background p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
          Geometry
        </p>
        <h2 className="mt-2 font-serif text-3xl leading-none">
          Draw the course polygon
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Use the polygon tool to trace the course. Keep one polygon active for
          this proof of concept.
        </p>
        <div className="mt-5">
          <AdminDrawMap
            geometry={mode.type === "edit" ? mode.record.geometry : null}
            onGeometryChange={handleGeometryChange}
          />
        </div>
        {errors.geometry ? (
          <p className="mt-3 text-sm leading-6 text-red-700">
            {errors.geometry}
          </p>
        ) : (
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {geometry ? "Polygon ready to save." : "No polygon drawn yet."}
          </p>
        )}
      </section>
    </div>
  )
}

export function AdminPage() {
  const records = useCourseRecords()
  const [mode, setMode] = useState<AdminMode>({ type: "list" })
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = records.findIndex((record) => record.id === active.id)
    const newIndex = records.findIndex((record) => record.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    void reorderCourses(arrayMove(records, oldIndex, newIndex))
  }
  const handleDelete = (record: CourseRecord) => {
    if (window.confirm(`Delete ${record.name}?`)) {
      void deleteCourse(record.id)
    }
  }

  return (
    <section className="min-h-[calc(100svh-4rem)] bg-muted/20 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {mode.type === "list" ? (
          <>
            <div className="flex flex-col gap-4 border-b border-emerald-950/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800">
                  Local admin
                </p>
                <h1 className="mt-2 font-serif text-4xl leading-none text-foreground sm:text-5xl">
                  Geo features
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Manage local IndexedDB course features. Drag rows to update
                  rank order.
                </p>
              </div>
              <Button onClick={() => setMode({ type: "add" })}>
                <Plus />
                Add feature
              </Button>
            </div>

            <div className="mt-6">
              {records.length === 0 ? (
                <div className="border border-emerald-950/10 bg-background p-8 text-center">
                  <p className="font-serif text-2xl leading-none">
                    No features yet.
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Add a course to begin building the local set.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={records.map((record) => record.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="grid gap-3">
                      {records.map((record) => (
                        <SortableCourseRow
                          key={record.id}
                          record={record}
                          onDelete={handleDelete}
                          onEdit={(nextRecord) =>
                            setMode({ type: "edit", record: nextRecord })
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </>
        ) : (
          <CourseForm
            mode={mode}
            records={records}
            onCancel={() => setMode({ type: "list" })}
            onSaved={() => setMode({ type: "list" })}
          />
        )}
      </div>
    </section>
  )
}
