import { useMemo } from "react";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DatabaseView } from "@/types";

export function useToolbarSensors(views: DatabaseView[]) {
  const propertySensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
  );

  const viewTabSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const viewIds = useMemo(() => views.map((v) => v.id), [views]);

  return { propertySensors, viewTabSensors, viewIds };
}
