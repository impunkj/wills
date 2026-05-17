import { Injectable } from '@nestjs/common'

type SequenceKey = 'customer' | 'case' | 'partner'

const SEQUENCE_PREFIX: Record<SequenceKey, string> = {
  customer: 'W24-CUST',
  case: 'W24-CASE',
  partner: 'PAT',
}

const SEQUENCE_REGEX: Record<SequenceKey, RegExp> = {
  customer: /^W24-CUST-(\d{5})$/,
  case: /^W24-CASE-(\d{5})$/,
  partner: /^PAT-(\d{5})$/,
}

@Injectable()
export class SequenceService {
  private readonly counters = new Map<SequenceKey, number>([
    ['customer', 0],
    ['case', 0],
    ['partner', 0],
  ])

  // Serialize mutations so concurrent async callers cannot mint duplicate IDs.
  private queue: Promise<void> = Promise.resolve()

  async nextCustomerId(): Promise<string> {
    return this.next('customer')
  }

  async nextCaseId(): Promise<string> {
    return this.next('case')
  }

  async nextPartnerId(): Promise<string> {
    return this.next('partner')
  }

  initializeCounter(key: SequenceKey, lastIssuedNumber: number) {
    const nextValue = Math.max(0, Math.trunc(lastIssuedNumber))
    this.counters.set(key, nextValue)
  }

  reserveFromExisting(key: SequenceKey, existingIds: readonly string[]) {
    const regex = SEQUENCE_REGEX[key]
    const maxIssued = existingIds.reduce((highest, id) => {
      const match = regex.exec(id)
      if (!match) {
        return highest
      }

      const parsed = Number.parseInt(match[1], 10)
      return Number.isNaN(parsed) ? highest : Math.max(highest, parsed)
    }, 0)

    const current = this.counters.get(key) ?? 0
    this.counters.set(key, Math.max(current, maxIssued))
  }

  peekCurrentValue(key: SequenceKey): number {
    return this.counters.get(key) ?? 0
  }

  private async next(key: SequenceKey): Promise<string> {
    return this.runExclusive(() => {
      const current = this.counters.get(key) ?? 0
      const nextValue = current + 1
      this.counters.set(key, nextValue)
      return `${SEQUENCE_PREFIX[key]}-${String(nextValue).padStart(5, '0')}`
    })
  }

  private runExclusive<T>(work: () => T | Promise<T>): Promise<T> {
    const nextTask = this.queue.then(work, work)

    this.queue = nextTask.then(
      () => undefined,
      () => undefined,
    )

    return nextTask
  }
}
