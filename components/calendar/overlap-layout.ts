import { CalendarBlock, MultiMemberBlock } from '@/lib/types';

/**
 * Layout information for positioning a calendar block
 */
export interface BlockLayoutInfo {
    columnIndex: number;
    totalColumns: number;
    widthPercent: number;
    leftPercent: number;
}

/**
 * Block with timing information for overlap detection
 */
interface BlockWithTime {
    block: CalendarBlock | MultiMemberBlock;
    startMs: number;
    endMs: number;
}

/**
 * A cluster of overlapping blocks that need to be laid out together
 */
interface OverlapCluster {
    blocks: BlockWithTime[];
    maxColumns: number;
    columnAssignments: Map<string, number>;
}

/**
 * Check if two blocks overlap in time
 */
function blocksOverlap(a: BlockWithTime, b: BlockWithTime): boolean {
    return a.startMs < b.endMs && a.endMs > b.startMs;
}

/**
 * Find connected components of overlapping blocks using BFS
 * Blocks are grouped together if they overlap directly or transitively
 * (e.g., A overlaps B, B overlaps C -> A, B, C are in same cluster)
 */
function findOverlapClusters(dayBlocks: BlockWithTime[]): OverlapCluster[] {
    const n = dayBlocks.length;
    if (n === 0) return [];

    // Build adjacency list for overlap graph
    const adjacent: Set<number>[] = dayBlocks.map(() => new Set());

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (blocksOverlap(dayBlocks[i], dayBlocks[j])) {
                adjacent[i].add(j);
                adjacent[j].add(i);
            }
        }
    }

    // Find connected components using BFS
    const visited = new Set<number>();
    const clusters: OverlapCluster[] = [];

    for (let i = 0; i < n; i++) {
        if (visited.has(i)) continue;

        // BFS to find all blocks in this cluster
        const clusterIndices: number[] = [];
        const queue = [i];
        visited.add(i);

        while (queue.length > 0) {
            const current = queue.shift()!;
            clusterIndices.push(current);

            for (const neighbor of adjacent[current]) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        const clusterBlocks = clusterIndices.map(idx => dayBlocks[idx]);
        clusters.push({
            blocks: clusterBlocks,
            maxColumns: 1,
            columnAssignments: new Map()
        });
    }

    return clusters;
}

/**
 * Assign blocks to columns within a cluster using greedy interval scheduling
 * This minimizes the number of columns needed while ensuring no overlap within a column
 */
function assignColumnsToCluster(cluster: OverlapCluster): void {
    // Sort blocks by start time, then by end time for stable ordering
    const sortedBlocks = [...cluster.blocks].sort((a, b) => {
        if (a.startMs !== b.startMs) return a.startMs - b.startMs;
        return a.endMs - b.endMs;
    });

    // Track end time of last block in each column
    const columnEndTimes: number[] = [];

    for (const blockWithTime of sortedBlocks) {
        // Find first column where this block can fit (no overlap)
        let assignedColumn = -1;

        for (let col = 0; col < columnEndTimes.length; col++) {
            if (columnEndTimes[col] <= blockWithTime.startMs) {
                assignedColumn = col;
                break;
            }
        }

        if (assignedColumn === -1) {
            // Need a new column
            assignedColumn = columnEndTimes.length;
            columnEndTimes.push(0);
        }

        // Assign block to column and update end time
        cluster.columnAssignments.set(blockWithTime.block.id, assignedColumn);
        columnEndTimes[assignedColumn] = blockWithTime.endMs;
    }

    cluster.maxColumns = Math.max(columnEndTimes.length, 1);
}

/**
 * Calculate layout information for all blocks in a set of clusters
 */
function calculateBlockLayouts(clusters: OverlapCluster[]): Map<string, BlockLayoutInfo> {
    const layoutMap = new Map<string, BlockLayoutInfo>();

    for (const cluster of clusters) {
        const totalColumns = cluster.maxColumns;
        const widthPercent = 100 / totalColumns;

        for (const blockWithTime of cluster.blocks) {
            const columnIndex = cluster.columnAssignments.get(blockWithTime.block.id) ?? 0;
            const leftPercent = columnIndex * widthPercent;

            layoutMap.set(blockWithTime.block.id, {
                columnIndex,
                totalColumns,
                widthPercent,
                leftPercent
            });
        }
    }

    return layoutMap;
}

/**
 * Main function to calculate layout for all blocks in a day
 * Returns a map from block ID to layout information
 */
export function calculateDayBlockLayouts(
    dayBlocks: (CalendarBlock | MultiMemberBlock)[]
): Map<string, BlockLayoutInfo> {
    if (dayBlocks.length === 0) {
        return new Map();
    }

    // De-duplicate blocks: when multiple owners have blocks for the SAME task at the SAME time,
    // they should be treated as ONE block, not overlapping blocks.
    // This prevents multi-owner tasks from appearing at half-width.
    const seenTaskTimeSlots = new Map<string, CalendarBlock | MultiMemberBlock>();
    const uniqueBlocks: (CalendarBlock | MultiMemberBlock)[] = [];
    const duplicateToOriginal = new Map<string, string>(); // Maps duplicate block IDs to the kept block ID

    for (const block of dayBlocks) {
        // Create a key based on taskId + startTime + endTime
        const timeSlotKey = `${block.taskId}-${block.startTime}-${block.endTime}`;

        if (!seenTaskTimeSlots.has(timeSlotKey)) {
            seenTaskTimeSlots.set(timeSlotKey, block);
            uniqueBlocks.push(block);
        } else {
            // This is a duplicate - map it to the original block for layout lookup
            const originalBlock = seenTaskTimeSlots.get(timeSlotKey)!;
            duplicateToOriginal.set(block.id, originalBlock.id);
        }
    }

    // Convert to blocks with timing info using unique blocks only
    const blocksWithTime: BlockWithTime[] = uniqueBlocks.map(block => ({
        block,
        startMs: new Date(block.startTime).getTime(),
        endMs: new Date(block.endTime).getTime()
    }));

    // Find clusters of overlapping blocks
    const clusters = findOverlapClusters(blocksWithTime);

    // Assign columns within each cluster
    clusters.forEach(cluster => assignColumnsToCluster(cluster));

    // Calculate final layout for unique blocks
    const layoutMap = calculateBlockLayouts(clusters);

    // Add layout info for duplicate blocks (same layout as their original)
    for (const [duplicateId, originalId] of duplicateToOriginal) {
        const originalLayout = layoutMap.get(originalId);
        if (originalLayout) {
            layoutMap.set(duplicateId, originalLayout);
        }
    }

    return layoutMap;
}

/**
 * Get layout info for blocks with a fallback for single non-overlapping blocks
 */
export function getBlocksWithLayout(
    dayBlocks: (CalendarBlock | MultiMemberBlock)[]
): Array<{ block: CalendarBlock | MultiMemberBlock; layout: BlockLayoutInfo }> {
    const layoutMap = calculateDayBlockLayouts(dayBlocks);

    return dayBlocks.map(block => ({
        block,
        layout: layoutMap.get(block.id) ?? {
            columnIndex: 0,
            totalColumns: 1,
            widthPercent: 100,
            leftPercent: 0
        }
    }));
}
