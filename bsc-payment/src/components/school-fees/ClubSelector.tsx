import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Club } from '../../types/types';
import { Check, AlertCircle } from 'lucide-react';

interface ClubSelectorProps {
  studentId: string;
  studentName: string;
  clubs: Club[];
  selectedClubIds: string[];
  onClubChange: (studentId: string, clubIds: string[]) => void;
  maxClubs?: number;
}

const ClubSelector: React.FC<ClubSelectorProps> = ({
  studentId,
  studentName,
  clubs,
  selectedClubIds,
  onClubChange,
  maxClubs = 2
}) => {
  const handleClubToggle = (clubId: string) => {
    if (selectedClubIds.includes(clubId)) {
      onClubChange(studentId, selectedClubIds.filter(id => id !== clubId));
    } else if (selectedClubIds.length < maxClubs) {
      onClubChange(studentId, [...selectedClubIds, clubId]);
    }
  };

  const isMaxSelected = selectedClubIds.length >= maxClubs;
  const hasNoSelection = selectedClubIds.length === 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{studentName}</CardTitle>
          <Badge variant={hasNoSelection ? "destructive" : "secondary"} className="text-xs">
            {selectedClubIds.length}/{maxClubs} clubs
          </Badge>
        </div>
        {hasNoSelection && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>Please select at least one club</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {clubs.map((club) => {
            const isSelected = selectedClubIds.includes((club.id));
            const isDisabled = !isSelected && isMaxSelected;

            return (
              <div
                key={club.id}
                onClick={() => !isDisabled && handleClubToggle((club.id))}
                className={`
                  relative p-3 rounded-lg border-2 transition-all cursor-pointer
                  ${isSelected
                    ? 'border-primary bg-primary/5'
                    : isDisabled
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary/50 bg-white'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-sm truncate">{club.name}</h5>
                    {club.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {club.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold text-primary whitespace-nowrap">
                      ₦{club.price.toLocaleString()}
                    </span>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubSelector;
