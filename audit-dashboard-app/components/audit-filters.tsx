'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditFilter } from '@/types/audit';
import { X, Filter } from 'lucide-react';

interface AuditFiltersProps {
  onFiltersChange: (filters: Partial<AuditFilter>) => void;
}

export default function AuditFilterComponent({ onFiltersChange }: AuditFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<Partial<AuditFilter>>({});

  const handleFilterChange = (key: keyof AuditFilter, value: any) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
  };

  const handleApply = () => {
    onFiltersChange(filters);
    setIsOpen(false);
  };

  const handleClear = () => {
    setFilters({});
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v);

  return (
    <div className="mb-6">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 w-full sm:w-auto"
      >
        <Filter className="w-4 h-4" />
        Filters {hasActiveFilters && <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{Object.values(filters).filter(Boolean).length}</span>}
      </Button>

      {isOpen && (
        <Card className="p-6 mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Action</label>
              <Select
                value={filters.action || ''}
                onValueChange={(value) => handleFilterChange('action', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Entity Type</label>
              <Input
                placeholder="Search entity type..."
                value={filters.entity_type || ''}
                onChange={(e) => handleFilterChange('entity_type', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Entity ID</label>
              <Input
                placeholder="Search entity ID..."
                value={filters.entity_id || ''}
                onChange={(e) => handleFilterChange('entity_id', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">User ID</label>
              <Input
                placeholder="Search user ID..."
                value={filters.user_id || ''}
                onChange={(e) => handleFilterChange('user_id', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search all fields..."
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClear} className="w-full sm:w-auto">
                Clear Filters
              </Button>
            )}
            <Button onClick={handleApply} className="w-full sm:w-auto">Apply Filters</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
