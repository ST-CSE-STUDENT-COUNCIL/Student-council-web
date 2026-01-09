import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useMemo } from 'react'
import { EventFilter, type SortOption, type StatusOption } from '../../components/events/EventFilter'
import { EventList } from '../../components/events/EventList'
import { EventCard } from '../../components/events/EventCard'
import { eventApi } from '../../lib/api/events.ts'
import type { Event } from '../../types/events'

export const Route = createFileRoute('/events/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter & Sort States
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('newest')
  const [status, setStatus] = useState<StatusOption>('all')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 5

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const data = await eventApi.getAll()
      setEvents(data)
      if (data.length > 0) {
        setSelectedEvent(data[0])
      }
    } catch (error) {
      console.error('Failed to fetch events', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, sort, status])

  const filteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        // Status Filter
        if (status !== 'all' && event.status !== status) return false

        // Search Filter
        if (search.trim()) {
          const query = search.toLowerCase()
          return (
            event.title.toLowerCase().includes(query) ||
            event.description.toLowerCase().includes(query)
          )
        }
        return true
      })
      .sort((a, b) => {
        // 1. Pinned events first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        // 2. Status Priority
        const statusOrder = { active: 0, scheduled: 1, closed: 2 };
        const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        if (statusDiff !== 0) return statusDiff;

        // 3. Sort Option (Newest/Oldest)
        if (sort === 'newest') return b.id - a.id;
        return a.id - b.id;
      })
  }, [events, status, search, sort])

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredEvents, currentPage])

  return (
    <div className="container mx-auto px-4 py-8">
      {/* <EventHeader /> */}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          {/* Left Column: Large Selected Card */}
          <div className="w-full lg:w-2/3">
            <div className="sticky top-8">
              {selectedEvent ? (
                <div className="transform transition-all duration-500 hover:scale-[1.01] animate-fade-in">
                  <EventCard event={selectedEvent} />
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
                  <p className="text-gray-500 text-lg">이벤트를 선택해주세요</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Filter & List */}
          <div className="w-full lg:w-1/3 flex flex-col sticky top-8 max-h-[calc(100vh-4rem)]">
            <div className="bg-gray-50 p-4 rounded-xl flex flex-col flex-1 min-h-0 border border-gray-100 shadow-sm">


              <div className="mb-4 shrink-0">
                <EventFilter
                  search={search}
                  onSearchChange={setSearch}
                  sort={sort}
                  onSortChange={setSort}
                  status={status}
                  onStatusChange={setStatus}
                />
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar mb-4 px-2 py-2">
                <EventList
                  events={paginatedEvents}
                  onEventSelect={setSelectedEvent}
                  selectedEventId={selectedEvent?.id}
                  className="flex flex-col gap-4"
                />
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-2 border-t border-gray-200 shrink-0">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${currentPage === page
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-200'
                          }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
