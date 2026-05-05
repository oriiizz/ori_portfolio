/**
 * 球面菜单 9 格的固定顺序（与纹理图集第 0…8 格一一对应）。
 *
 * - 第 0 项默认朝前（About）；其余为 p1…p8。
 * - 每个 id 对应 personal/assets/<id>/ 下的封面与媒体（about、cover.*）。
 * - 文案与路由仍以 portfolioData 为准；此处只决定「第几格贴哪张封面、点进去对应哪个 id」。
 *
 * 若要与文件夹不一致，只改此数组顺序即可；并确保 portfolioData.projects 里含对应 p* 的 id。
 */
export const ORB_FACE_ORDER = Object.freeze(['about', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'])
