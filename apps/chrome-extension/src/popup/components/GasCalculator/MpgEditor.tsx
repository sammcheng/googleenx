import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MpgEditorProps, MPG_PRESETS, MIN_MPG, MAX_MPG } from './types';

/**
 * MPG Editor component
 * Allows inline editing of MPG with presets and validation
 */
export const MpgEditor: React.FC<MpgEditorProps> = ({
  currentMpg,
  onSave,
  onCancel,
  className = ''
}) => {
  const [mpg, setMpg] = useState(currentMpg.toString());
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  /**
   * Handle MPG input change
   */
  const handleMpgChange = useCallback((value: string) => {
    setMpg(value);
    setSelectedPreset(''); // Clear preset when manually typing
  }, []);

  /**
   * Handle preset selection
   */
  const handlePresetSelect = useCallback((preset: { label: string; value: number }) => {
    setMpg(preset.value.toString());
    setSelectedPreset(preset.label);
  }, []);

  /**
   * Handle save
   */
  const handleSave = useCallback(() => {
    const mpgValue = parseFloat(mpg);
    if (mpgValue >= MIN_MPG && mpgValue <= MAX_MPG) {
      onSave(mpgValue);
    }
  }, [mpg, onSave]);

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  /**
   * Handle key press
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  /**
   * Validate MPG value
   */
  const isValidMpg = useCallback(() => {
    const mpgValue = parseFloat(mpg);
    return !isNaN(mpgValue) && mpgValue >= MIN_MPG && mpgValue <= MAX_MPG;
  }, [mpg]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* MPG Input */}
      <div className="flex items-center space-x-3">
        <div className="flex-1">
          <label htmlFor="mpg-input" className="block text-sm font-medium text-yellow-700 mb-1">
            Miles per Gallon
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="mpg-input"
              type="number"
              min={MIN_MPG}
              max={MAX_MPG}
              step="0.1"
              value={mpg}
              onChange={(e) => handleMpgChange(e.target.value)}
              onKeyDown={handleKeyPress}
              className={`
                w-full px-3 py-2 border rounded-lg text-sm
                ${isValidMpg() 
                  ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500' 
                  : 'border-red-300 focus:border-red-500 focus:ring-red-500'
                }
                focus:outline-none focus:ring-2
              `}
              placeholder="Enter MPG"
              aria-label="Miles per gallon input"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-yellow-600 text-sm">mpg</span>
            </div>
          </div>
          {!isValidMpg() && mpg && (
            <p className="text-red-600 text-xs mt-1">
              Please enter a value between {MIN_MPG} and {MAX_MPG}
            </p>
          )}
        </div>
      </div>

      {/* MPG Presets */}
      <div>
        <label className="block text-sm font-medium text-yellow-700 mb-2">
          Quick Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {MPG_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetSelect(preset)}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-colors duration-200
                ${selectedPreset === preset.label || mpg === preset.value.toString()
                  ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                  : 'bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50'
                }
              `}
            >
              {preset.label}
              <div className="text-xs text-yellow-600">{preset.value} mpg</div>
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isValidMpg()}
          className={`
            px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
            ${isValidMpg()
              ? 'bg-yellow-600 text-white hover:bg-yellow-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          Save MPG
        </button>
      </div>

      {/* Help Text */}
      <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
        <div className="font-medium mb-1">💡 Tips:</div>
        <ul className="space-y-1">
          <li>• Check your vehicle's fuel economy rating</li>
          <li>• Consider your driving habits (city vs highway)</li>
          <li>• Electric vehicles: set MPG to 0 for no gas cost</li>
          <li>• This setting will be saved for future calculations</li>
        </ul>
      </div>
    </div>
  );
};
