export type GenerateScheduleInput = {
  name: string;
  startsAt?: string;
  endsAt?: string;
};

export async function generateSchedulePlan(input: GenerateScheduleInput) {
  // TODO: implement generation logic
  return {
    id: 'gen_' + Date.now(),
    name: input.name,
    startsAt: input.startsAt || null,
    endsAt: input.endsAt || null,
    status: 'draft' as const,
  };
}
