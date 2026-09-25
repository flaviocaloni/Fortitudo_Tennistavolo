"use client";

import { useState } from "react";
import FitetDataModal from "./fitet-data-modal";

interface Team {
  id: string;
  name: string;
  series: string;
  group_code: string;
  fitet_cam_code?: number | null;
}

function getFitetUrls(team: Team) {
  if (!team.fitet_cam_code) return null;

  const cam = team.fitet_cam_code;
  return {
    calendario: `https://portale.fitet.org/risultati/campionati/Calendario.asp?CAM=${cam}&ANNO=41`,
    classifica: `https://portale.fitet.org/risultati/campionati/classifica_squadre.php?CAM=${cam}`,
    statistiche: `https://portale.fitet.org/risultati/campionati/statistiche_atleti.php?CAM=${cam}`,
    pdf: `https://portale.fitet.org/fpdf2/stampa_calend.php?ANNO=41&CAM=${cam}`,
  };
}

function sortTeamsBySeriesAndGroup(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    // Extract series number: D1 = 1, D2 = 2, D3 = 3
    const seriesA = parseInt(a.series.replace("D", ""), 10) || 0;
    const seriesB = parseInt(b.series.replace("D", ""), 10) || 0;

    if (seriesA !== seriesB) {
      return seriesA - seriesB; // Sort by series number (1, 2, 3)
    }

    // If same series, sort by group code alphabetically
    return a.group_code.localeCompare(b.group_code);
  });
}

export default function FitetLinksTable({ teams }: { teams: Team[] }) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [modalTitle, setModalTitle] = useState<string>("");

  const handleOpenModal = (url: string, title: string) => {
    setSelectedUrl(url);
    setModalTitle(title);
  };

  const handleCloseModal = () => {
    setSelectedUrl(null);
    setModalTitle("");
  };

  if (!teams || teams.length === 0) {
    return null;
  }

  const sortedTeams = sortTeamsBySeriesAndGroup(teams);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Squadre - Link Classifica e Risultati FITET
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Squadra
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Serie
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Girone
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team) => {
                const fitetUrls = getFitetUrls(team);
                return (
                  <tr key={team.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {team.series}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {team.group_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-center space-x-2">
                      {fitetUrls ? (
                        <>
                          <button
                            onClick={() =>
                              handleOpenModal(
                                fitetUrls.classifica,
                                `${team.name} - Classifica FITET`
                              )
                            }
                            className="text-blue-600 hover:underline text-xs sm:text-sm"
                          >
                            📊 Classifica
                          </button>
                          <button
                            onClick={() =>
                              handleOpenModal(
                                fitetUrls.calendario,
                                `${team.name} - Risultati FITET`
                              )
                            }
                            className="text-green-600 hover:underline text-xs sm:text-sm"
                          >
                            📅 Risultati
                          </button>
                          <button
                            onClick={() =>
                              handleOpenModal(
                                fitetUrls.statistiche,
                                `${team.name} - Statistiche Atleti FITET`
                              )
                            }
                            className="text-purple-600 hover:underline text-xs sm:text-sm"
                          >
                            👥 Atleti
                          </button>
                          <a
                            href={fitetUrls.pdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-red-600 hover:underline text-xs sm:text-sm"
                          >
                            📄 PDF
                          </a>
                        </>
                      ) : (
                        <span className="text-gray-400 text-xs">
                          CAM code non configurato
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUrl && (
        <FitetDataModal
          url={selectedUrl}
          title={modalTitle}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
